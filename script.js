document.addEventListener('DOMContentLoaded', () => {
    const rankFilter = document.getElementById('rank-filter');
    const fieldFilter = document.getElementById('field-filter');
    const typeFilter = document.getElementById('type-filter');
    const resultsContainer = document.getElementById('results');

    let allData = [];

    fetch('ccf.json')
        .then(response => response.json())
        .then(jsonData => {
            allData = jsonData.fieldsOfStudy;
            populateFieldFilter(allData);
            renderTable();
        });

    function populateFieldFilter(fields) {
        fields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.name;
            option.textContent = field.name;
            fieldFilter.appendChild(option);
        });
    }

    function renderTable() {
        const rank = rankFilter.value;
        const fieldName = fieldFilter.value;
        const type = typeFilter.value;

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
                                hasResults = true;
                                table += `<tr>
                                    <td><a href="${item.url}" target="_blank">${item.abbreviation}</a></td>
                                    <td class="w-50">${item.fullName}</td>
                                    <td><span class="badge ${typeBadges[categoryName]}">${categoryName}</span></td>
                                    <td><span class="badge ${rankBadges[categoryRank]}">${categoryRank}</span></td>
                                    <td>${field.name}</td>
                                    <td>${item.publisher}</td>
                                    <td>${item.notes || ''}</td>
                                </tr>`;
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

    rankFilter.addEventListener('change', renderTable);
    fieldFilter.addEventListener('change', renderTable);
    typeFilter.addEventListener('change', renderTable);
});
