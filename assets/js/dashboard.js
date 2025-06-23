// Enhanced Dashboard functionality with tech styling
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const dashboardDate = document.getElementById('dashboard-date');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const articlesContainer = document.getElementById('articles-container');
    const articleCount = document.getElementById('article-count');
    const showingCount = document.getElementById('showing-count');
    const keyHighlightsContainer = document.getElementById('key-highlights');
    const modal = document.getElementById('article-modal');
    const modalContent = document.getElementById('modal-content');
    const closeBtn = document.getElementsByClassName('close')[0];
    const therapyAreaButtons = document.getElementById('therapy-area-buttons');
    const termButtons = document.getElementById('term-buttons');
    const showFiltersMobile = document.querySelector('.show-filters-mobile');
    const filterSidebar = document.querySelector('.filter-sidebar');
    const closeSidebar = document.querySelector('.close-sidebar');
    
    // Mobile filters toggle
    if (showFiltersMobile && filterSidebar && closeSidebar) {
        showFiltersMobile.addEventListener('click', function() {
            filterSidebar.classList.add('active');
        });
        
        closeSidebar.addEventListener('click', function() {
            filterSidebar.classList.remove('active');
        });
    }
    
    // Close modal when clicking the × button
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }
    }
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === "block") {
            modal.style.display = "none";
        }
    });
    
    // Chart elements
    const sourcesChart = document.getElementById('sources-chart').getContext('2d');
    const areasChart = document.getElementById('areas-chart').getContext('2d');
    const datesChart = document.getElementById('dates-chart').getContext('2d');
    
    // Chart instances
    let sourcesChartInstance = null;
    let areasChartInstance = null;
    let datesChartInstance = null;
    
    // Tech-themed chart palettes
    const multiColorPalette = [
        '#3b82f6', // tech blue
        '#8b5cf6', // tech purple
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // red
        '#06b6d4', // cyan
        '#84cc16', // lime
        '#f97316', // orange
        '#8b5cf6', // violet
        '#6366f1', // indigo
        '#14b8a6', // teal
        '#eab308', // yellow
        '#f43f5e', // rose
        '#a855f7', // purple
        '#0ea5e9', // sky
        '#22c55e'  // green
    ];
    
    // State variables
    let allArticles = [];
    let filteredArticles = [];
    let keyHighlights = null;
    let selectedTherapyArea = 'All';
    let selectedTerm = 'All';
    
    // Fetch data - Replace this URL with your JSON file path
    fetch('data/latest_dashboard_data.json')
        .then(response => response.json())
        .then(data => {
            // Update dashboard date with tech styling
            const generatedAt = new Date(data.metadata.generatedAt);
            dashboardDate.textContent = `LAST_SYNC: ${generatedAt.toISOString().split('T')[0].replace(/-/g, '.')}_${generatedAt.toTimeString().split(' ')[0]}`;
            
            // Store articles
            allArticles = data.articles;
            filteredArticles = [...allArticles];
            
            // Store key highlights if available
            if (data.keyHighlights) {
                keyHighlights = data.keyHighlights;
                renderKeyHighlights();
            } else {
                keyHighlightsContainer.innerHTML = `
                    <div class="text-center py-4 text-gray-500 font-mono">
                        No neural patterns detected for this period.
                    </div>
                `;
            }
            
            // Initialize filter buttons
            initializeFilterButtons();
            
            // Set up event listeners
            setupEventListeners();
            
            // Apply initial filters
            applyFilters();
            
            // Initialize charts
            initializeCharts();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            articlesContainer.innerHTML = `
                <div class="text-center py-6 text-red-500 col-span-full font-mono">
                    ERROR: Neural network connection failed. Please retry.
                </div>
            `;
            keyHighlightsContainer.innerHTML = `
                <div class="text-center py-4 text-red-500 font-mono">
                    ERROR: Failed to load system highlights.
                </div>
            `;
        });
    
    // Render key highlights section with tech styling
    function renderKeyHighlights() {
        if (!keyHighlights) return;
        
        let highlightsHTML = '';
        
        // Add summary
        highlightsHTML += `
            <div class="mb-6">
                <h3 class="text-lg font-medium text-blue-400 mb-3 font-mono">NETWORK.SUMMARY</h3>
                <p class="text-gray-300 leading-relaxed">${keyHighlights.summary}</p>
            </div>
        `;
        
        // Add key trends if available
        if (keyHighlights.trends && keyHighlights.trends.length > 0) {
            highlightsHTML += `
                <div class="mb-6">
                    <h3 class="text-lg font-medium text-blue-400 mb-3 font-mono">TREND.ANALYSIS</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${keyHighlights.trends.map(trend => 
                            `<div class="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                                <span class="text-gray-300 text-sm">${trend.startsWith('-') ? trend.substring(1).trim() : trend}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        // Add emerging technologies if available
        if (keyHighlights.technologies && keyHighlights.technologies.length > 0) {
            highlightsHTML += `
                <div class="mb-6">
                    <h3 class="text-lg font-medium text-blue-400 mb-3 font-mono">EMERGING.TECH</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${keyHighlights.technologies.map(tech => 
                            `<div class="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 border border-purple-500/20">
                                <span class="text-gray-300 text-sm">${tech.startsWith('-') ? tech.substring(1).trim() : tech}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        // Add article distribution if available
        if (keyHighlights.therapy_area_distribution) {
            const totalArticles = keyHighlights.total_articles || 
                Object.values(keyHighlights.therapy_area_distribution).reduce((a, b) => a + b, 0);
                
            highlightsHTML += `
                <div class="mb-4">
                    <h3 class="text-lg font-medium text-blue-400 mb-3 font-mono">DATA.METRICS</h3>
                    <div class="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                        <p class="text-gray-300 mb-3 font-mono">TOTAL_ARTICLES: <span class="text-green-400 font-bold">${totalArticles}</span></p>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                            ${Object.entries(keyHighlights.therapy_area_distribution).map(([area, count]) => `
                                <div class="flex justify-between items-center bg-slate-700/30 p-2 rounded text-xs">
                                    <span class="text-gray-400 font-mono">${area}</span>
                                    <span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-mono">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        keyHighlightsContainer.innerHTML = highlightsHTML;
    }
    
    // Initialize filter buttons
    function initializeFilterButtons() {
        // Clear existing buttons except "All"
        therapyAreaButtons.innerHTML = '<button class="filter-btn active" data-value="All">All Areas</button>';
        termButtons.innerHTML = '<button class="filter-btn active" data-value="All">All Sources</button>';
        
        // Get unique therapy areas
        const therapyAreas = [...new Set(allArticles.map(article => article.therapyArea))];
        
        // Create therapy area buttons
        therapyAreas.forEach(area => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = area;
            button.dataset.value = area;
            therapyAreaButtons.appendChild(button);
        });
        
        // Get all terms
        const allTerms = [...new Set(allArticles.map(article => article.term))];
        
        // Create term buttons
        allTerms.forEach(term => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = term;
            button.dataset.value = term;
            termButtons.appendChild(button);
        });
    }
    
    // Update term buttons based on selected therapy area
    function updateTermButtons() {
        // Get terms for the selected therapy area
        let availableTerms;
        if (selectedTherapyArea === 'All') {
            availableTerms = ['All', ...new Set(allArticles.map(article => article.term))];
        } else {
            availableTerms = ['All', ...new Set(allArticles
                .filter(article => article.therapyArea === selectedTherapyArea)
                .map(article => article.term))];
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
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', applyFilters);
        
        // Sort select
        sortSelect.addEventListener('change', applyFilters);
        
        // Topic area buttons
        therapyAreaButtons.addEventListener('click', function(e) {
            if (e.target.classList.contains('filter-btn')) {
                // Remove active class from all buttons
                therapyAreaButtons.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update selected therapy area
                selectedTherapyArea = e.target.dataset.value;
                
                // If changing therapy area, reset term to All
                selectedTerm = 'All';
                termButtons.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.value === 'All') {
                        btn.classList.add('active');
                    }
                });
                
                // Update term buttons
                updateTermButtons();
                
                // Apply filters
                applyFilters();
                
                // Close mobile sidebar if open
                if (filterSidebar) {
                    filterSidebar.classList.remove('active');
                }
            }
        });
        
        // Source term buttons
        termButtons.addEventListener('click', function(e) {
            if (e.target.classList.contains('filter-btn') && !e.target.disabled) {
                // Remove active class from all buttons
                termButtons.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update selected term
                selectedTerm = e.target.dataset.value;
                
                // Apply filters
                applyFilters();
                
                // Close mobile sidebar if open
                if (filterSidebar) {
                    filterSidebar.classList.remove('active');
                }
            }
        });
    }
    
    // Apply filters
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
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
        articleCount.textContent = `[${filteredArticles.length}]`;
        showingCount.textContent = `DISPLAYING ${filteredArticles.length} OF ${allArticles.length} RECORDS`;
        
        // Render articles
        renderArticles();
        
        // Update charts
        updateCharts();
    }
    
    // Render articles in a grid layout with tech styling
    function renderArticles() {
        if (filteredArticles.length === 0) {
            articlesContainer.innerHTML = `
                <div class="text-center py-6 text-gray-500 col-span-full font-mono">
                    NO RECORDS MATCH CURRENT FILTERS. ADJUST PARAMETERS.
                </div>
            `;
            return;
        }
        
        articlesContainer.innerHTML = '';
        
        filteredArticles.forEach((article, index) => {
            const articleElement = document.createElement('div');
            articleElement.className = 'article-card rounded-lg p-5 transition-all duration-300';
            articleElement.dataset.articleIndex = index;
            
            // Format takeaways as list items
            const takeawaysList = article.takeaways.map(takeaway => 
                `<li class="mb-1 text-sm text-gray-300">${takeaway.startsWith('-') ? takeaway.substring(1).trim() : takeaway}</li>`
            ).join('');
            
            articleElement.innerHTML = `
                <div class="mb-3">
                    <h3 class="text-lg font-medium text-white mb-2 line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors view-details">
                        ${article.title}
                    </h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 font-mono">
                            ${article.therapyArea}
                        </span>
                        <span class="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400 font-mono">
                            ${article.term}
                        </span>
                    </div>
                    <div class="text-sm text-gray-400 mb-3 font-mono">${article.date} • ${article.journal}</div>
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-300 text-sm mb-3 leading-relaxed">${article.summary}</p>
                    <div class="text-sm">
                        <span class="text-blue-400 font-medium font-mono">KEY_INSIGHTS:</span>
                        <ul class="list-disc pl-5 mt-2">
                            ${takeawaysList}
                        </ul>
                    </div>
                </div>
                
                <div class="flex justify-between items-center pt-3 border-t border-gray-600">
                    <button class="tech-button py-1 px-3 rounded-md text-sm transition-colors view-details font-mono">
                        VIEW_DETAILS
                    </button>
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 text-sm font-mono transition-colors">
                        READ_ORIGINAL →
                    </a>
                </div>
            `;
            
            // Add event listeners to view details buttons and title
            const viewDetailsElements = articleElement.querySelectorAll('.view-details');
            viewDetailsElements.forEach(element => {
                element.addEventListener('click', function() {
                    showArticleDetails(article);
                });
            });
            
            articlesContainer.appendChild(articleElement);
        });
    }
    
    // Show article details in modal with tech styling
    function showArticleDetails(article) {
        // Format takeaways as list items
        const takeawaysList = article.takeaways.map(takeaway => 
            `<li class="mb-1">${takeaway.startsWith('-') ? takeaway.substring(1).trim() : takeaway}</li>`
        ).join('');
        
        modalContent.innerHTML = `
            <h2 class="text-xl font-bold text-blue-400 mb-4 font-mono">NEURAL_RECORD_${article.id.toString().padStart(3, '0')}</h2>
            
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-white mb-2">${article.title}</h3>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-4">
                <span class="px-3 py-1 text-sm rounded bg-blue-500/20 text-blue-400 font-mono">
                    ${article.therapyArea}
                </span>
                <span class="px-3 py-1 text-sm rounded bg-purple-500/20 text-purple-400 font-mono">
                    ${article.term}
                </span>
                <span class="px-3 py-1 text-sm rounded bg-green-500/20 text-green-400 font-mono">
                    ${article.journal}
                </span>
            </div>
            
            <div class="mb-4 p-4 bg-slate-700/30 rounded-lg">
                <p class="text-gray-400 text-sm font-mono mb-1">TIMESTAMP: ${article.date}</p>
                <p class="text-gray-400 text-sm font-mono mb-1">SOURCE: ${article.journal}</p>
                ${article.authors ? `<p class="text-gray-400 text-sm font-mono">AUTHORS: ${article.authors}</p>` : ''}
            </div>
            
            <div class="mb-4">
                <h3 class="font-semibold text-lg mb-2 text-blue-400 font-mono">SUMMARY.DATA</h3>
                <p class="text-gray-300 leading-relaxed">${article.summary}</p>
            </div>
            
            <div class="mb-6">
                <h3 class="font-semibold text-lg mb-2 text-blue-400 font-mono">EXTRACTED.INSIGHTS</h3>
                <ul class="list-disc pl-5 text-gray-300">
                    ${takeawaysList}
                </ul>
            </div>
            
            <div class="text-center">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" 
                   class="tech-button px-6 py-2 rounded font-mono transition-colors">
                    ACCESS_ORIGINAL_SOURCE →
                </a>
            </div>
        `;
        
        modal.style.display = "block";
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
    
    // Create and update sources chart with tech styling
    function createSourcesChart() {
        // Destroy existing chart if it exists
        if (sourcesChartInstance) {
            sourcesChartInstance.destroy();
        }
        
        // Prepare data
        const sourceData = prepareSourcesData();
        
        // Generate background colors for each bar
        const backgroundColors = sourceData.labels.map((_, index) => 
            multiColorPalette[index % multiColorPalette.length]
        );
        
        // Create chart
        sourcesChartInstance = new Chart(sourcesChart, {
            type: 'bar',
            data: {
                labels: sourceData.labels,
                datasets: [{
                    label: 'Articles',
                    data: sourceData.data,
                    backgroundColor: backgroundColors.map(color => color + '40'),
                    borderColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0',
                            font: {
                                family: 'JetBrains Mono'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: '#94a3b8',
                            font: {
                                family: 'JetBrains Mono'
                            }
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                family: 'JetBrains Mono'
                            }
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    function updateSourcesChart() {
        if (!sourcesChartInstance) return;
        
        // Destroy existing chart
        sourcesChartInstance.destroy();
        
        // Create a new chart
        createSourcesChart();
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
    
    // Create and update areas chart with tech styling
    function createAreasChart() {
        // Destroy existing chart if it exists
        if (areasChartInstance) {
            areasChartInstance.destroy();
        }
        
        // Prepare data
        const areaData = prepareAreasData();
        
        // Generate background colors for each slice
        const backgroundColors = areaData.labels.map((_, index) => 
            multiColorPalette[index % multiColorPalette.length]
        );
        
        // Create chart
        areasChartInstance = new Chart(areasChart, {
            type: 'pie',
            data: {
                labels: areaData.labels,
                datasets: [{
                    data: areaData.data,
                    backgroundColor: backgroundColors.map(color => color + '60'),
                    borderColor: backgroundColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0',
                            font: {
                                family: 'JetBrains Mono'
                            }
                        }
                    }
                }
            }
        });
    }
    
    function updateAreasChart() {
        if (!areasChartInstance) return;
        
        // Destroy existing chart
        areasChartInstance.destroy();
        
        // Create a new chart
        createAreasChart();
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
    
    // Create and update dates chart with tech styling
    function createDatesChart() {
        // Destroy existing chart if it exists
        if (datesChartInstance) {
            datesChartInstance.destroy();
        }
        
        // Prepare data
        const dateData = prepareDatesData();
        
        // Create chart
        datesChartInstance = new Chart(datesChart, {
            type: 'line',
            data: {
                labels: dateData.labels,
                datasets: [{
                    label: 'Publications',
                    data: dateData.data,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0',
                            font: {
                                family: 'JetBrains Mono'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: '#94a3b8',
                            font: {
                                family: 'JetBrains Mono'
                            }
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                family: 'JetBrains Mono'
                            }
                        },
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    function updateDatesChart() {
        if (!datesChartInstance) return;
        
        // Destroy existing chart
        datesChartInstance.destroy();
        
        // Create a new chart
        createDatesChart();
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
    
    // Add tech-style interactions
    const cards = document.querySelectorAll('.article-card, .metric-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.borderColor = 'rgba(59, 130, 246, 0.6)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.borderColor = 'rgba(59, 130, 246, 0.2)';
        });
    });
});
