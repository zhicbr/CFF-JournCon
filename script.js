document.addEventListener('DOMContentLoaded', () => {
    const rankFilter = document.getElementById('rank-filter');
    const fieldFilter = document.getElementById('field-filter');
    const typeFilter = document.getElementById('type-filter');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const selectionModeButton = document.getElementById('selection-mode-button');
    const resultsContainer = document.getElementById('results');
    const selectedItemsContainer = document.getElementById('selected-items-container');

    let allData = [];
    let isSelectionMode = false;
    let selectedItems = new Set(JSON.parse(localStorage.getItem('selectedItems')) || []);

    fetch('ccf.json')
        .then(response => response.json())
        .then(jsonData => {
            allData = jsonData.fieldsOfStudy;
            populateFieldFilter(allData);
            render();
        });

    function populateFieldFilter(fields) {
        fields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.name;
            option.textContent = field.name;
            fieldFilter.appendChild(option);
        });
    }

    function render() {
        renderSelectedItems();
        renderTable();
    }

    function renderSelectedItems() {
        if (selectedItems.size === 0) {
            selectedItemsContainer.innerHTML = '';
            return;
        }

        let selectedHtml = '<h5 class="mb-3">Selected Items</h5><div class="list-group">';
        let foundItems = [];

        allData.forEach(field => {
            const findItems = (category, categoryName) => {
                for (const [categoryRank, items] of Object.entries(category)) {
                    items.forEach(item => {
                        const itemId = `${item.abbreviation}-${categoryName}-${field.name}`;
                        if (selectedItems.has(itemId)) {
                            foundItems.push({ ...item, categoryName, categoryRank, fieldName: field.name });
                        }
                    });
                }
            };
            findItems(field.journals, 'Journal');
            findItems(field.conferences, 'Conference');
        });

        foundItems.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

        foundItems.forEach(item => {
            const itemId = `${item.abbreviation}-${item.categoryName}-${item.fieldName}`;
            selectedHtml += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span class="selection-dot selected" data-item-id="${itemId}"></span>
                        <a href="${item.url}" target="_blank">${item.abbreviation}</a> - ${item.fullName}
                    </div>
                    <small class="text-muted">${item.categoryName} / ${item.categoryRank} / ${item.fieldName}</small>
                </div>`;
        });

        selectedHtml += '</div>';
        selectedItemsContainer.innerHTML = selectedHtml;
    }

    function renderTable() {
        const rank = rankFilter.value;
        const fieldName = fieldFilter.value;
        const type = typeFilter.value;
        const searchQuery = searchInput.value.toLowerCase();

        const rankBadges = {
            'A': 'bg-danger',
            'B': 'bg-warning text-dark',
            'C': 'bg-success'
        };

        const typeBadges = {
            'Journal': 'bg-primary',
            'Conference': 'bg-info text-dark'
        };

        let table = '<table class="table table-striped table-hover table-bordered align-middle"><thead><tr><th>Abbreviation</th><th>Full Name</th><th>Type</th><th>Rank</th><th>Field</th><th>Publisher</th><th>Notes</th></tr></thead><tbody>';

        let hasResults = false;

        allData.forEach(field => {
            if (fieldName === 'all' || field.name === fieldName) {
                const processCategory = (category, categoryName) => {
                    for (const [categoryRank, items] of Object.entries(category)) {
                        if (rank === 'all' || categoryRank === rank) {
                            items.forEach(item => {
                                if (searchQuery === '' || item.abbreviation.toLowerCase().includes(searchQuery) || item.fullName.toLowerCase().includes(searchQuery)) {
                                    hasResults = true;
                                    const itemId = `${item.abbreviation}-${categoryName}-${field.name}`;
                                    const isSelected = selectedItems.has(itemId);
                                    
                                    const selectionDot = isSelectionMode ? `<span class="selection-dot ${isSelected ? 'selected' : ''}" data-item-id="${itemId}"></span>` : '';

                                    table += `<tr>
                                        <td>${selectionDot}<a href="${item.url}" target="_blank">${item.abbreviation}</a></td>
                                        <td class="w-50">${item.fullName}</td>
                                        <td><span class="badge ${typeBadges[categoryName]}">${categoryName}</span></td>
                                        <td><span class="badge ${rankBadges[categoryRank]}">${categoryRank}</span></td>
                                        <td>${field.name}</td>
                                        <td>${item.publisher}</td>
                                        <td>${item.notes || ''}</td>
                                    </tr>`;
                                }
                            });
                        }
                    }
                };

                if (type === 'all' || type === 'journals') {
                    processCategory(field.journals, 'Journal');
                }
                if (type === 'all' || type === 'conferences') {
                    processCategory(field.conferences, 'Conference');
                }
            }
        });

        if (!hasResults) {
            table += '<tr><td colspan="7" class="text-center">No results found.</td></tr>';
        }

        table += '</tbody></table>';
        resultsContainer.innerHTML = table;
    }

    function toggleSelection(itemId) {
        if (selectedItems.has(itemId)) {
            selectedItems.delete(itemId);
        } else {
            selectedItems.add(itemId);
        }

        if (selectedItems.size === 0) {
            localStorage.removeItem('selectedItems');
        } else {
            localStorage.setItem('selectedItems', JSON.stringify(Array.from(selectedItems)));
        }
        render();
    }

    selectionModeButton.addEventListener('click', () => {
        isSelectionMode = !isSelectionMode;
        if (isSelectionMode) {
            selectionModeButton.textContent = 'cancel';
            selectionModeButton.classList.remove('btn-primary');
            selectionModeButton.classList.add('btn-secondary');
        } else {
            selectionModeButton.textContent = 'Select Mode';
            selectionModeButton.classList.remove('btn-secondary');
            selectionModeButton.classList.add('btn-primary');
        }
        renderTable();
    });

    // Event delegation for selection dots
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('selection-dot')) {
            const itemId = event.target.dataset.itemId;
            if (itemId) {
                toggleSelection(itemId);
            }
        }
    });

    rankFilter.addEventListener('change', render);
    fieldFilter.addEventListener('change', render);
    typeFilter.addEventListener('change', render);
    searchButton.addEventListener('click', render);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            render();
        }
    });
});
