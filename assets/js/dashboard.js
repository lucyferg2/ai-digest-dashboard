// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const dashboardDate = document.getElementById('dashboard-date');
    const searchInput = document.getElementById('search-input');
    const therapyAreaSelect = document.getElementById('therapy-area-select');
    const termSelect = document.getElementById('term-select');
    const sortSelect = document.getElementById('sort-select');
    const articlesContainer = document.getElementById('articles-container');
    const articleCount = document.getElementById('article-count');
    const showingCount = document.getElementById('showing-count');
    
    // Chart elements
    const sourcesChart = document.getElementById('sources-chart').getContext('2d');
    const areasChart = document.getElementById('areas-chart').getContext('2d');
    const datesChart = document.getElementById('dates-chart').getContext('2d');
    
    // Chart instances
    let sourcesChartInstance = null;
    let areasChartInstance = null;
    let datesChartInstance = null;
    
    // Data
    let allArticles = [];
    let filteredArticles = [];
    
    // Fetch data
    fetch('data/latest_dashboard_data.json')
        .then(response => response.json())
        .then(data => {
            // Update dashboard date
            const generatedAt = new Date(data.metadata.generatedAt);
            dashboardDate.textContent = `Last Updated: ${generatedAt.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`;
            
            // Store articles
            allArticles = data.articles;
            filteredArticles = [...allArticles];
            
            // Initialize filters
            initializeFilters();
            
            // Apply initial filters
            applyFilters();
            
            // Initialize charts
            initializeCharts();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            articlesContainer.innerHTML = `
                <div class="text-center py-6 text-red-500">
                    Error loading data. Please try again later.
                </div>
            `;
        });
    
    // Initialize filter dropdowns
    function initializeFilters() {
        // Get unique therapy areas
        const therapyAreas = ['All', ...new Set(allArticles.map(article => article.therapyArea))];
        
        // Populate therapy area dropdown
        therapyAreaSelect.innerHTML = '';
        therapyAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            therapyAreaSelect.appendChild(option);
        });
        
        // Set up event listeners
        searchInput.addEventListener('input', applyFilters);
        therapyAreaSelect.addEventListener('change', function() {
            populateTermsDropdown();
            applyFilters();
        });
        termSelect.addEventListener('change', applyFilters);
        sortSelect.addEventListener('change', applyFilters);
        
        // Initialize terms dropdown
        populateTermsDropdown();
    }
    
    // Populate terms dropdown based on selected therapy area
    function populateTermsDropdown() {
        const selectedTherapyArea = therapyAreaSelect.value;
        
        // Get terms for the selected therapy area
        let terms;
        if (selectedTherapyArea === 'All') {
            terms = ['All', ...new Set(allArticles.map(article => article.term))];
        } else {
            terms = ['All', ...new Set(allArticles
                .filter(article => article.therapyArea === selectedTherapyArea)
                .map(article => article.term))];
        }
        
        // Populate terms dropdown
        termSelect.innerHTML = '';
        terms.forEach(term => {
            const option = document.createElement('option');
            option.value = term;
            option.textContent = term;
            termSelect.appendChild(option);
        });
    }
    
    // Apply filters
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const sortOrder = sortSelect.value;
        
        // Start with all articles
        let articles = [...allArticles];
        
        // Filter by date range first
        articles = filterByDateRange(articles, selectedDateRange);
        
        // Filter articles by other criteria
        filteredArticles = articles.filter(article => {
            // Filter by therapy area - check both single and multiple therapy areas
            if (selectedTherapyArea !== 'All') {
                let hasTherapyArea = false;
                if (Array.isArray(article.therapyAreas)) {
                    hasTherapyArea = article.therapyAreas.includes(selectedTherapyArea);
                } else {
                    hasTherapyArea = article.therapyArea === selectedTherapyArea;
                }
                if (!hasTherapyArea) {
                    return false;
                }
            }
            
            // Filter by term - check both single and multiple terms
            if (selectedTerm !== 'All') {
                let hasTerm = false;
                if (Array.isArray(article.terms)) {
                    hasTerm = article.terms.includes(selectedTerm);
                } else {
                    hasTerm = article.term === selectedTerm;
                }
                if (!hasTerm) {
                    return false;
                }
            }
            
            // Filter by search term
            if (searchTerm) {
                const articleText = `${article.title} ${article.description} ${article.summary} ${article.takeaways.join(' ')}`.toLowerCase();
                return articleText.includes(searchTerm);
            }
            
            return true;
        });
        
        // Sort articles
        filteredArticles.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        // Update article count
        articleCount.textContent = `(${filteredArticles.length})`;
        showingCount.textContent = `Showing ${filteredArticles.length} of ${allArticles.length} articles`;
        
        // Render articles
        renderArticles();
        
        // Update charts
        updateCharts();
    }

    // Handle multiple therapy areas and terms
    function showArticleDetails(article) {
        const articleAge = getArticleAge(article.date);
        const articleDate = new Date(article.date);
        const daysAgo = Math.ceil((new Date().getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Handle multiple therapy areas and terms
        const therapyAreas = article.therapyAreas || [article.therapyArea];
        const terms = article.terms || [article.term];
        
        // Create badges for modal
        let modalBadgesHtml = '';
        therapyAreas.forEach(area => {
            modalBadgesHtml += `<span class="px-2 py-1 text-xs rounded-full bg-brand-light-orange text-brand-dark-red mr-1 mb-1 inline-block">${area}</span>`;
        });
        terms.forEach(term => {
            modalBadgesHtml += `<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-brand-dark-red mr-1 mb-1 inline-block">${term}</span>`;
        });
        modalBadgesHtml += `<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-brand-dark-red mr-1 mb-1 inline-block">${article.journal}</span>`;
        
        if (articleAge === 'new') {
            modalBadgesHtml += '<span class="px-2 py-1 text-xs rounded-full bg-green-500 text-white mr-1 mb-1 inline-block">NEW</span>';
        }
        if (daysAgo <= 7) {
            modalBadgesHtml += '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 mr-1 mb-1 inline-block">This Week</span>';
        }
        
        // Format takeaways as list items
        const takeawaysList = article.takeaways.map(takeaway => 
            `<li class="mb-1">${takeaway.startsWith('-') ? takeaway.substring(1).trim() : takeaway}</li>`
        ).join('');
        
        modalContent.innerHTML = `
            <h2 class="text-xl font-bold text-brand-dark-red mb-4">${article.title}</h2>
            
            <div class="flex flex-wrap gap-2 mb-3">
                ${modalBadgesHtml}
            </div>
            
            <div class="mb-4">
                <p><strong>Date:</strong> ${article.date}</p>
                <p><strong>Source:</strong> ${article.journal}</p>
                ${article.authors ? `<p><strong>Authors:</strong> ${article.authors}</p>` : ''}
                ${therapyAreas.length > 1 ? `<p><strong>Relevant to:</strong> ${therapyAreas.join(', ')}</p>` : ''}
                ${terms.length > 1 ? `<p><strong>Found on:</strong> ${terms.join(', ')}</p>` : ''}
            </div>
            
            <div class="mb-4">
                <h3 class="font-semibold text-lg mb-2">Summary</h3>
                <p>${article.summary}</p>
            </div>
            
            <div class="mb-4">
                <h3 class="font-semibold text-lg mb-2">Key Takeaways</h3>
                <ul class="list-disc pl-5">
                    ${takeawaysList}
                </ul>
            </div>
            
            <div class="mt-6 text-center">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" 
                   class="inline-block px-6 py-2 bg-brand-orange text-white rounded hover:bg-brand-red transition-colors">
                    Read Original Article
                </a>
            </div>
        `;
        
        modal.style.display = "block";
    }
    
    // Render articles
    function renderArticles() {
        if (filteredArticles.length === 0) {
            let emptyMessage = "No articles found matching your filters.";
            
            // Special message for therapy areas with no articles
            if (selectedTherapyArea !== 'All') {
                const hasArticlesForTherapyArea = allArticles.some(article => {
                    // Check both single and multiple therapy areas
                    if (Array.isArray(article.therapyAreas)) {
                        return article.therapyAreas.includes(selectedTherapyArea);
                    } else {
                        return article.therapyArea === selectedTherapyArea;
                    }
                });
                if (!hasArticlesForTherapyArea) {
                    emptyMessage = `No relevant articles published for ${selectedTherapyArea} in the past month.`;
                }
            }
            
            articlesContainer.innerHTML = `
                <div class="text-center py-6 text-gray-500 col-span-full">
                    ${emptyMessage}
                    ${selectedTherapyArea !== 'All' || selectedTerm !== 'All' || searchInput.value ? '<br>Try adjusting your search criteria.' : ''}
                </div>
            `;
            return;
        }
        
        articlesContainer.innerHTML = '';
        
        filteredArticles.forEach((article, index) => {
            const articleElement = document.createElement('div');
            const articleAge = getArticleAge(article.date);
            
            // Determine article classes based on age
            let articleClasses = 'border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow article bg-white';
            if (articleAge === 'this-week') {
                articleClasses += ' article-this-week';
            } else if (articleAge !== 'new') {
                articleClasses += ' article-older';
            }
            
            articleElement.className = articleClasses;
            articleElement.dataset.articleIndex = index;
            
            // Use the date as-is without relative time indicators
            const dateDisplay = article.date;
            
            // Handle multiple therapy areas and terms
            const therapyAreas = article.therapyAreas || [article.therapyArea];
            const terms = article.terms || [article.term];
            const badgesHtml = createMultipleBadges(therapyAreas, terms, articleAge);
            
            articleElement.innerHTML = `
                <h3 class="text-lg font-medium text-brand-red mb-2 line-clamp-2">
                    ${article.title}
                </h3>
                <div class="flex flex-wrap gap-1 mb-3">
                    ${badgesHtml}
                </div>
                <div class="text-sm text-gray-500 mb-3">${dateDisplay} · ${article.journal}</div>
                <p class="text-gray-600 text-sm summary-text mb-4">${article.summary}</p>
                <div class="mt-auto pt-2 flex justify-between items-center">
                    <button class="bg-brand-orange hover:bg-brand-red text-white py-1 px-3 rounded-md text-sm transition-colors view-details">View Details</button>
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="text-brand-red hover:underline text-sm">Read Original</a>
                </div>
            `;
            
            // Add event listener to view details button
            articleElement.querySelector('.view-details').addEventListener('click', function() {
                showArticleDetails(article);
            });
            
            // Add event listener to article title for viewing details
            articleElement.querySelector('h3').addEventListener('click', function() {
                showArticleDetails(article);
            });
            
            articlesContainer.appendChild(articleElement);
        });
    }
    
    // Initialize charts
    function initializeCharts() {
        // Create charts
        createSourcesChart();
        createAreasChart();
        createDatesChart();
    }
    
    // Update charts based on filtered articles
    function updateCharts() {
        updateSourcesChart();
        updateAreasChart();
        updateDatesChart();
    }
    
    // Create and update sources chart
    function createSourcesChart() {

        // Destroy existing chart if it exists
        if (sourcesChartInstance) {
            sourcesChartInstance.destroy();
        }
        
        // Prepare data
        const sourceData = prepareSourcesData();
        
        // Create chart
        sourcesChartInstance = new Chart(sourcesChart, {
            type: 'bar',
            data: {
                labels: sourceData.labels,
                datasets: [{
                    label: 'Number of Articles',
                    data: sourceData.data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    function updateSourcesChart() {
        if (!sourcesChartInstance) return;
        
        // Prepare data
        const sourceData = prepareSourcesData();
        
        // Update chart
        sourcesChartInstance.data.labels = sourceData.labels;
        sourcesChartInstance.data.datasets[0].data = sourceData.data;
        sourcesChartInstance.update();
    }
    
    // Update the prepareSourcesData function to handle multiple terms
    function prepareSourcesData() {
        // Count articles by source/term - handle both single and multiple terms
        const sourceCounts = {};
        
        filteredArticles.forEach(article => {
            // Always count by journal (primary source)
            sourceCounts[article.journal] = (sourceCounts[article.journal] || 0) + 1;
            
            // Optionally, you might also want to count by terms/feeds
            // Uncomment the below if you want to include RSS feed names in the source chart
            /*
            if (Array.isArray(article.terms)) {
                article.terms.forEach(term => {
                    sourceCounts[term] = (sourceCounts[term] || 0) + 1;
                });
            } else {
                sourceCounts[article.term] = (sourceCounts[article.term] || 0) + 1;
            }
            */
        });
        
        // Convert to arrays and sort by count (descending)
        const entries = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 sources
        
        // Extract labels and data
        const labels = entries.map(entry => entry[0]);
        const data = entries.map(entry => entry[1]);
        
        return { labels, data };
    }
    
    function initializeFilterButtons() {
        // Clear existing buttons except "All"
        therapyAreaButtons.innerHTML = '<button class="filter-btn active" data-value="All">All Areas</button>';
        termButtons.innerHTML = '<button class="filter-btn active" data-value="All">All Sources</button>';
        
        // Get all therapy areas from keyHighlights (which includes all areas from config)
        if (keyHighlights && keyHighlights.therapy_area_distribution) {
            allTherapyAreas = Object.keys(keyHighlights.therapy_area_distribution);
        } else {
            // Fallback: get unique therapy areas from articles (handle multiple therapy areas)
            allTherapyAreas = [];
            allArticles.forEach(article => {
                if (Array.isArray(article.therapyAreas)) {
                    article.therapyAreas.forEach(area => {
                        if (!allTherapyAreas.includes(area)) {
                            allTherapyAreas.push(area);
                        }
                    });
                } else if (!allTherapyAreas.includes(article.therapyArea)) {
                    allTherapyAreas.push(article.therapyArea);
                }
            });
        }
        
        // Create therapy area buttons - show all areas, even with 0 articles
        allTherapyAreas.forEach(area => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            
            // Check if this area has articles
            const articleCount = keyHighlights && keyHighlights.therapy_area_distribution ? 
                keyHighlights.therapy_area_distribution[area] : 
                allArticles.filter(article => {
                    if (Array.isArray(article.therapyAreas)) {
                        return article.therapyAreas.includes(area);
                    } else {
                        return article.therapyArea === area;
                    }
                }).length;
            
            if (articleCount === 0) {
                button.classList.add('no-articles');
                button.innerHTML = `${area} <span class="text-xs">(No articles)</span>`;
            } else {
                button.textContent = area;
            }
            
            button.dataset.value = area;
            therapyAreaButtons.appendChild(button);
        });
        
        // Get all terms (handle multiple terms per article)
        const allTermsSet = new Set();
        allArticles.forEach(article => {
            if (Array.isArray(article.terms)) {
                article.terms.forEach(term => allTermsSet.add(term));
            } else {
                allTermsSet.add(article.term);
            }
        });
        const allTerms = Array.from(allTermsSet);
        
        // Create term buttons
        allTerms.forEach(term => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = term;
            button.dataset.value = term;
            termButtons.appendChild(button);
        });
    }

    function updateTermButtons() {
        // Get terms for the selected therapy area
        let availableTerms;
        if (selectedTherapyArea === 'All') {
            const allTermsSet = new Set(['All']);
            allArticles.forEach(article => {
                if (Array.isArray(article.terms)) {
                    article.terms.forEach(term => allTermsSet.add(term));
                } else {
                    allTermsSet.add(article.term);
                }
            });
            availableTerms = Array.from(allTermsSet);
        } else {
            const availableTermsSet = new Set(['All']);
            allArticles.forEach(article => {
                let hasTherapyArea = false;
                if (Array.isArray(article.therapyAreas)) {
                    hasTherapyArea = article.therapyAreas.includes(selectedTherapyArea);
                } else {
                    hasTherapyArea = article.therapyArea === selectedTherapyArea;
                }
                
                if (hasTherapyArea) {
                    if (Array.isArray(article.terms)) {
                        article.terms.forEach(term => availableTermsSet.add(term));
                    } else {
                        availableTermsSet.add(article.term);
                    }
                }
            });
            availableTerms = Array.from(availableTermsSet);
        }
        
        // Update button styles to show which terms are available
        const termBtns = termButtons.querySelectorAll('.filter-btn');
        termBtns.forEach(btn => {
            if (btn.dataset.value === 'All' || availableTerms.includes(btn.dataset.value)) {
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.disabled = false;
            } else {
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                btn.disabled = true;
            }
            
            // Update active state
            if (btn.dataset.value === selectedTerm) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Create and update areas chart
    function createAreasChart() {
            if (datesChartInstance) {
            datesChartInstance.destroy();
        }
            
        // Prepare data
        const areaData = prepareAreasData();
        
        // Create chart
        areasChartInstance = new Chart(areasChart, {
            type: 'pie',
            data: {
                labels: areaData.labels,
                datasets: [{
                    data: areaData.data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(199, 199, 199, 0.6)',
                        'rgba(83, 102, 255, 0.6)',
                        'rgba(40, 159, 64, 0.6)',
                        'rgba(210, 30, 30, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                        'rgba(83, 102, 255, 1)',
                        'rgba(40, 159, 64, 1)',
                        'rgba(210, 30, 30, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    function updateAreasChart() {
        if (!areasChartInstance) return;
        
        // Prepare data
        const areaData = prepareAreasData();
        
        // Update chart
        areasChartInstance.data.labels = areaData.labels;
        areasChartInstance.data.datasets[0].data = areaData.data;
        areasChartInstance.update();
    }
    
    function prepareAreasData() {
        // Count articles by therapy area - handle both single and multiple therapy areas
        const areaCounts = {};
        
        // Initialize all therapy areas with 0
        allTherapyAreas.forEach(area => {
            areaCounts[area] = 0;
        });
        
        // Count filtered articles - handle multiple therapy areas per article
        filteredArticles.forEach(article => {
            if (Array.isArray(article.therapyAreas)) {
                // Multiple therapy areas - count for each
                article.therapyAreas.forEach(area => {
                    areaCounts[area] = (areaCounts[area] || 0) + 1;
                });
            } else {
                // Single therapy area (backward compatibility)
                areaCounts[article.therapyArea] = (areaCounts[article.therapyArea] || 0) + 1;
            }
        });
        
        // Only show areas that have articles for the chart
        const entriesWithArticles = Object.entries(areaCounts).filter(([area, count]) => count > 0);
        
        // Convert to arrays
        const labels = entriesWithArticles.map(entry => entry[0]);
        const data = entriesWithArticles.map(entry => entry[1]);
        
        return { labels, data };
    }
    
    // Create and update dates chart
    function createDatesChart() {
        // Prepare data
        const dateData = prepareDatesData();
        
        // Create chart
        datesChartInstance = new Chart(datesChart, {
            type: 'line',
            data: {
                labels: dateData.labels,
                datasets: [{
                    label: 'Articles Published',
                    data: dateData.data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    function updateDatesChart() {
        if (!datesChartInstance) return;
        
        // Prepare data
        const dateData = prepareDatesData();
        
        // Update chart
        datesChartInstance.data.labels = dateData.labels;
        datesChartInstance.data.datasets[0].data = dateData.data;
        datesChartInstance.update();
    }
    
    function prepareDatesData() {
        // Count articles by date
        const dateCounts = {};
        filteredArticles.forEach(article => {
            dateCounts[article.date] = (dateCounts[article.date] || 0) + 1;
        });
        
        // Convert to arrays and sort by date
        const entries = Object.entries(dateCounts)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]));
        
        // Extract labels and data
        const labels = entries.map(entry => entry[0]);
        const data = entries.map(entry => entry[1]);
        
        return { labels, data };
    }

    // Handle multiple therapy areas and terms 
    function createMultipleBadges(therapyAreas, terms, articleAge) {
        let badgesHtml = '';
        
        // Create therapy area badges
        if (Array.isArray(therapyAreas)) {
            therapyAreas.forEach(area => {
                badgesHtml += `<span class="px-2 py-0.5 text-xs rounded-full bg-brand-light-orange text-brand-dark-red mr-1 mb-1 inline-block">${area}</span>`;
            });
        } else {
            // Fallback for single therapy area (backward compatibility)
            badgesHtml += `<span class="px-2 py-0.5 text-xs rounded-full bg-brand-light-orange text-brand-dark-red mr-1 mb-1 inline-block">${therapyAreas}</span>`;
        }
        
        // Create source/term badges
        if (Array.isArray(terms)) {
            terms.forEach(term => {
                badgesHtml += `<span class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-brand-dark-red mr-1 mb-1 inline-block">${term}</span>`;
            });
        } else {
            // Fallback for single term (backward compatibility)
            badgesHtml += `<span class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-brand-dark-red mr-1 mb-1 inline-block">${terms}</span>`;
        }
        
        // Add age indicator
        if (articleAge === 'new') {
            badgesHtml += '<span class="px-2 py-0.5 text-xs rounded-full bg-green-500 text-white mr-1 mb-1 inline-block">NEW</span>';
        }
        
        return badgesHtml;
    }

});
