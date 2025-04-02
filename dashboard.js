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
        const selectedTherapyArea = therapyAreaSelect.value;
        const selectedTerm = termSelect.value;
        const sortOrder = sortSelect.value;
        
        // Filter articles
        filteredArticles = allArticles.filter(article => {
            // Filter by therapy area
            if (selectedTherapyArea !== 'All' && article.therapyArea !== selectedTherapyArea) {
                return false;
            }
            
            // Filter by term
            if (selectedTerm !== 'All' && article.term !== selectedTerm) {
                return false;
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
    
    // Render articles
    function renderArticles() {
        if (filteredArticles.length === 0) {
            articlesContainer.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    No articles found matching your filters. Try adjusting your search criteria.
                </div>
            `;
            return;
        }
        
        articlesContainer.innerHTML = '';
        
        filteredArticles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
            
            // Format takeaways as list items
            const takeawaysList = article.takeaways.map(takeaway => 
                `<li>${takeaway.startsWith('-') ? takeaway.substring(1).trim() : takeaway}</li>`
            ).join('');
            
            articleElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-medium text-blue-800">
                            <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="hover:underline">
                                ${article.journal}
                            </span>
                        </div>
                    </div>
                    <span class="text-sm text-gray-500">${article.date}</span>
                </div>
                
                <div class="mt-3">
                    <div class="mb-2">
                        <span class="font-medium text-gray-700">Summary:</span> ${article.summary}
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Key Takeaways:</span>
                        <ul class="list-disc pl-5 mt-1">
                            ${takeawaysList}
                        </ul>
                    </div>
                    <div class="mt-2">
                        <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-sm">
                            Read original article
                        </a>
                    </div>
                </div>
            `;
            
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
    
    function prepareSourcesData() {
        // Count articles by source
        const sourceCounts = {};
        filteredArticles.forEach(article => {
            sourceCounts[article.journal] = (sourceCounts[article.journal] || 0) + 1;
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
    
    // Create and update areas chart
    function createAreasChart() {
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
        // Count articles by therapy area
        const areaCounts = {};
        filteredArticles.forEach(article => {
            areaCounts[article.therapyArea] = (areaCounts[article.therapyArea] || 0) + 1;
        });
        
        // Convert to arrays
        const labels = Object.keys(areaCounts);
        const data = Object.values(areaCounts);
        
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
});