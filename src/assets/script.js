// Main JavaScript for Judestone USA Website

// Load product data
let productsData = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load products data
    if (typeof window.productsData !== 'undefined') {
        productsData = window.productsData;
    }
    
    // Initialize page-specific functionality
    const path = window.location.pathname;
    
    if (path.includes('quartz-designs') || path.endsWith('/')) {
        initQuartzGallery();
    } else if (path.includes('sinks')) {
        initSinksGallery();
    }
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize saved designs
    initSavedDesigns();
});

// Mobile Menu Toggle
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');
    
    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
}

// Quartz Designs Gallery
function initQuartzGallery() {
    if (!productsData || !productsData.materials) return;
    
    const filterBar = document.querySelector('.filter-bar');
    const productGrid = document.querySelector('.product-grid');
    const sortSelect = document.querySelector('.sort-select');
    
    if (!filterBar || !productGrid) return;
    
    // Create filter buttons
    createFilterButtons(filterBar, productsData.materialFilters || []);
    
    // Render products
    let filteredProducts = [...productsData.materials];
    renderProducts(productGrid, filteredProducts, 'material');
    
    // Filter functionality
    const filterButtons = filterBar.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Toggle active state
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Get active filters
            const activeFilters = Array.from(filterBar.querySelectorAll('.filter-btn.active'))
                .map(b => b.textContent.trim());
            
            // Filter products
            filteredProducts = filterProducts(productsData.materials, activeFilters);
            
            // Sort and render
            filteredProducts = sortProducts(filteredProducts, sortSelect.value);
            renderProducts(productGrid, filteredProducts, 'material');
        });
    });
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            filteredProducts = sortProducts(filteredProducts, this.value);
            renderProducts(productGrid, filteredProducts, 'material');
        });
    }
}

// Sinks Gallery
function initSinksGallery() {
    if (!productsData || !productsData.sinks) return;
    
    const filterBar = document.querySelector('.filter-bar');
    const productGrid = document.querySelector('.product-grid');
    const sortSelect = document.querySelector('.sort-select');
    
    if (!filterBar || !productGrid) return;
    
    // Create filter buttons for sinks (Category, Series, Type)
    const categories = [...new Set(productsData.sinks.map(s => s.Category))];
    const series = [...new Set(productsData.sinks.map(s => s.Series))];
    
    createSinkFilters(filterBar, categories, series);
    
    // Render products
    let filteredProducts = [...productsData.sinks];
    renderProducts(productGrid, filteredProducts, 'sink');
    
    // Filter functionality
    const filterButtons = filterBar.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Toggle active state
            const filterGroup = this.closest('.filter-group');
            filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Get active filters
            const activeCategory = filterBar.querySelector('[data-filter="category"].active')?.textContent.trim();
            const activeSeries = filterBar.querySelector('[data-filter="series"].active')?.textContent.trim();
            
            // Filter products
            filteredProducts = filterSinks(productsData.sinks, activeCategory, activeSeries);
            
            // Sort and render
            filteredProducts = sortProducts(filteredProducts, sortSelect.value);
            renderProducts(productGrid, filteredProducts, 'sink');
        });
    });
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            filteredProducts = sortProducts(filteredProducts, this.value);
            renderProducts(productGrid, filteredProducts, 'sink');
        });
    }
}

// Create Filter Buttons
function createFilterButtons(container, filters) {
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    
    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'ALL';
    filterGroup.appendChild(allBtn);
    
    // Add filter buttons
    filters.forEach(filter => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = filter;
        filterGroup.appendChild(btn);
    });
    
    container.querySelector('.filter-container').appendChild(filterGroup);
}

// Create Sink Filters
function createSinkFilters(container, categories, series) {
    const filterContainer = container.querySelector('.filter-container');
    
    // Category filters
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'filter-group';
    categoryGroup.innerHTML = '<span style="color: var(--white); margin-right: 8px;">Category:</span>';
    
    const allCategoryBtn = document.createElement('button');
    allCategoryBtn.className = 'filter-btn active';
    allCategoryBtn.textContent = 'ALL';
    allCategoryBtn.setAttribute('data-filter', 'category');
    categoryGroup.appendChild(allCategoryBtn);
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = cat;
        btn.setAttribute('data-filter', 'category');
        categoryGroup.appendChild(btn);
    });
    
    filterContainer.appendChild(categoryGroup);
    
    // Series filters
    const seriesGroup = document.createElement('div');
    seriesGroup.className = 'filter-group';
    seriesGroup.innerHTML = '<span style="color: var(--white); margin-right: 8px;">Series:</span>';
    
    const allSeriesBtn = document.createElement('button');
    allSeriesBtn.className = 'filter-btn active';
    allSeriesBtn.textContent = 'ALL';
    allSeriesBtn.setAttribute('data-filter', 'series');
    seriesGroup.appendChild(allSeriesBtn);
    
    series.forEach(ser => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = ser;
        btn.setAttribute('data-filter', 'series');
        seriesGroup.appendChild(btn);
    });
    
    filterContainer.appendChild(seriesGroup);
}

// Filter Products
function filterProducts(products, activeFilters) {
    if (!activeFilters || activeFilters.length === 0 || activeFilters.includes('ALL')) {
        return products;
    }
    
    return products.filter(product => {
        const tags = product.Tag ? product.Tag.split(';').map(t => t.trim()) : [];
        return activeFilters.some(filter => 
            tags.some(tag => tag.toLowerCase() === filter.toLowerCase())
        );
    });
}

// Filter Sinks
function filterSinks(sinks, category, series) {
    let filtered = sinks;
    
    if (category && category !== 'ALL') {
        filtered = filtered.filter(s => s.Category === category);
    }
    
    if (series && series !== 'ALL') {
        filtered = filtered.filter(s => s.Series === series);
    }
    
    return filtered;
}

// Sort Products
function sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch(sortBy) {
        case 'name-asc':
            return sorted.sort((a, b) => {
                const nameA = a['Color Name'] || a.Model || '';
                const nameB = b['Color Name'] || b.Model || '';
                return nameA.localeCompare(nameB);
            });
        case 'name-desc':
            return sorted.sort((a, b) => {
                const nameA = a['Color Name'] || a.Model || '';
                const nameB = b['Color Name'] || b.Model || '';
                return nameB.localeCompare(nameA);
            });
        case 'newest':
            // Assuming Group or Category indicates newness
            return sorted.sort((a, b) => {
                const groupA = parseInt(a.Group || a.Category || '0');
                const groupB = parseInt(b.Group || b.Category || '0');
                return groupB - groupA;
            });
        case 'recommended':
        default:
            return sorted;
    }
}

// Render Products
function renderProducts(container, products, type) {
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No products found</h3><p>Try adjusting your filters</p></div>';
        return;
    }
    
    products.forEach(product => {
        const card = createProductCard(product, type);
        container.appendChild(card);
    });
}

// Create Product Card
function createProductCard(product, type) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    if (type === 'material') {
        card.innerHTML = `
            <img src="${product['Image URL']}" alt="${product['Color Name']}" class="product-card-image" loading="lazy">
            <div class="product-card-content">
                <h3 class="product-card-title">${product['Color Name']}</h3>
                <div class="product-card-brand">${product.Brand}</div>
                <p class="product-card-description">${product['Short Description']}</p>
                <div class="product-card-tags">
                    ${product.Tag ? product.Tag.split(';').slice(0, 3).map(tag => 
                        `<span class="tag">${tag.trim()}</span>`
                    ).join('') : ''}
                </div>
            </div>
        `;
    } else if (type === 'sink') {
        card.innerHTML = `
            <img src="${product['Image URL']}" alt="${product.Model}" class="product-card-image" loading="lazy">
            <div class="product-card-content">
                <h3 class="product-card-title">${product.Model}</h3>
                <div class="product-card-brand">${product.Series} Series - ${product.Type}</div>
                <p class="product-card-description">${product['Short Description']}</p>
                <div style="margin-top: 8px; color: var(--navy-primary); font-size: 0.9rem;">
                    Size: ${product['Size (L x W x H)']}
                </div>
            </div>
        `;
    }
    
    // Add click handler for saved designs
    card.addEventListener('click', function() {
        // Could open modal or navigate to detail page
        console.log('Product clicked:', product);
    });
    
    return card;
}

// Saved Designs
function initSavedDesigns() {
    const savedLink = document.querySelector('.saved-designs-link');
    if (savedLink) {
        savedLink.addEventListener('click', function(e) {
            e.preventDefault();
            const saved = getSavedDesigns();
            if (saved.length === 0) {
                alert('You have no saved designs yet.');
            } else {
                // Show saved designs modal or navigate to saved page
                console.log('Saved designs:', saved);
            }
        });
    }
}

function getSavedDesigns() {
    const saved = localStorage.getItem('judestone_saved_designs');
    return saved ? JSON.parse(saved) : [];
}

function saveDesign(productId) {
    const saved = getSavedDesigns();
    if (!saved.includes(productId)) {
        saved.push(productId);
        localStorage.setItem('judestone_saved_designs', JSON.stringify(saved));
    }
}

function removeSavedDesign(productId) {
    const saved = getSavedDesigns();
    const filtered = saved.filter(id => id !== productId);
    localStorage.setItem('judestone_saved_designs', JSON.stringify(filtered));
}
