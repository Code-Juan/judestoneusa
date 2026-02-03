// Main JavaScript for Judestone Website

// Load product data
let productsData = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Load products data
    if (typeof window.productsData !== 'undefined') {
        productsData = window.productsData;
    }

    // Initialize page-specific functionality
    const path = window.location.pathname;

    if (path.includes('sinks')) {
        initSinksGallery();
    } else if (path.includes('quartz-designs') || path.endsWith('/') || path.includes('index')) {
        initQuartzGallery();
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
        toggle.addEventListener('click', function () {
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
        btn.addEventListener('click', function () {
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
        sortSelect.addEventListener('change', function () {
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
        btn.addEventListener('click', function () {
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
        sortSelect.addEventListener('change', function () {
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

    switch (sortBy) {
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

    const productId = type === 'material' ? product['Color Name'] : product.Model;
    const isSaved = isDesignSaved(productId);

    if (type === 'material') {
        card.innerHTML = `
            <div class="product-card-image-wrapper">
                <img src="${product['Image URL']}" alt="${product['Color Name']}" class="product-card-image" loading="lazy">
                <button class="save-heart-btn ${isSaved ? 'saved' : ''}" data-product-id="${productId}" aria-label="Save design">
                    <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
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
            <div class="product-card-image-wrapper">
                <img src="${product['Image URL']}" alt="${product.Model}" class="product-card-image" loading="lazy">
                <button class="save-heart-btn ${isSaved ? 'saved' : ''}" data-product-id="${productId}" aria-label="Save design">
                    <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
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

    // Add click handler for heart button
    const heartBtn = card.querySelector('.save-heart-btn');
    if (heartBtn) {
        heartBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleSaveDesign(productId, this);
        });
    }

    // Add click handler to open product detail modal
    card.addEventListener('click', function () {
        showProductDetail(product, type);
    });

    // Make card appear clickable
    card.style.cursor = 'pointer';

    return card;
}

// Show Product Detail Modal
function showProductDetail(product, type) {
    // Remove existing modal if any
    const existingModal = document.getElementById('product-detail-modal');
    if (existingModal) existingModal.remove();

    const productId = type === 'material' ? product['Color Name'] : product.Model;
    const isSaved = isDesignSaved(productId);

    let detailHtml = '';

    if (type === 'material') {
        const allTags = product.Tag ? product.Tag.split(';').map(tag => 
            `<span class="detail-tag">${tag.trim()}</span>`
        ).join('') : '';

        detailHtml = `
            <div class="detail-image-container">
                <img src="${product['Image URL']}" alt="${product['Color Name']}" class="detail-image">
            </div>
            <div class="detail-info">
                <div class="detail-header">
                    <h2 class="detail-title">${product['Color Name']}</h2>
                    <button class="detail-save-btn ${isSaved ? 'saved' : ''}" data-product-id="${productId}">
                        <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="detail-brand">${product.Brand} • ${product.Finish}</div>
                <div class="detail-meta">
                    <span class="detail-meta-item">Group ${product.Group}</span>
                </div>
                <p class="detail-description">${product['Short Description']}</p>
                <div class="detail-tags">
                    ${allTags}
                </div>
            </div>
        `;
    } else if (type === 'sink') {
        const allTags = product.Tag ? product.Tag.split(';').map(tag => 
            `<span class="detail-tag">${tag.trim()}</span>`
        ).join('') : '';

        detailHtml = `
            <div class="detail-image-container">
                <img src="${product['Image URL']}" alt="${product.Model}" class="detail-image">
            </div>
            <div class="detail-info">
                <div class="detail-header">
                    <h2 class="detail-title">${product.Model}</h2>
                    <button class="detail-save-btn ${isSaved ? 'saved' : ''}" data-product-id="${productId}">
                        <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="detail-brand">${product.Series} Series • ${product.Type}</div>
                <div class="detail-meta">
                    <span class="detail-meta-item">${product.Category}</span>
                    <span class="detail-meta-item">Size: ${product['Size (L x W x H)']}</span>
                </div>
                <p class="detail-description">${product['Short Description']}</p>
                <div class="detail-tags">
                    ${allTags}
                </div>
            </div>
        `;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'product-detail-modal';
    modal.className = 'product-detail-overlay';
    modal.innerHTML = `
        <div class="product-detail-content">
            <button class="detail-close-btn" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
            </button>
            ${detailHtml}
        </div>
    `;

    document.body.appendChild(modal);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Close button handler
    modal.querySelector('.detail-close-btn').addEventListener('click', closeProductDetail);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProductDetail();
    });

    // Escape key to close
    document.addEventListener('keydown', handleDetailEscape);

    // Save button handler
    const saveBtn = modal.querySelector('.detail-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            toggleSaveDesign(productId, this);
            // Also update card heart button
            document.querySelectorAll(`.save-heart-btn[data-product-id="${productId}"]`).forEach(heart => {
                if (this.classList.contains('saved')) {
                    heart.classList.add('saved');
                    heart.querySelector('svg').setAttribute('fill', 'currentColor');
                } else {
                    heart.classList.remove('saved');
                    heart.querySelector('svg').setAttribute('fill', 'none');
                }
            });
        });
    }
}

function closeProductDetail() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleDetailEscape);
    }
}

function handleDetailEscape(e) {
    if (e.key === 'Escape') closeProductDetail();
}

function isDesignSaved(productId) {
    const saved = getSavedDesigns();
    return saved.includes(productId);
}

function toggleSaveDesign(productId, button) {
    const saved = getSavedDesigns();
    const index = saved.indexOf(productId);

    if (index > -1) {
        // Remove from saved
        saved.splice(index, 1);
        button.classList.remove('saved');
        button.querySelector('svg').setAttribute('fill', 'none');
    } else {
        // Add to saved
        saved.push(productId);
        button.classList.add('saved');
        button.querySelector('svg').setAttribute('fill', 'currentColor');
    }

    localStorage.setItem('judestone_saved_designs', JSON.stringify(saved));
    updateSavedCount();
}

function updateSavedCount() {
    const saved = getSavedDesigns();
    const countEl = document.querySelector('.saved-count');
    const savedLink = document.querySelector('.saved-designs-link');

    if (countEl) {
        const count = saved.length;
        if (count > 0) {
            countEl.textContent = count;
            countEl.style.display = 'flex';
        } else {
            countEl.style.display = 'none';
        }
    }

    // Also fill heart if items are saved
    if (savedLink && saved.length > 0) {
        const svg = savedLink.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'currentColor');
    } else if (savedLink) {
        const svg = savedLink.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'none');
    }
}

// Saved Designs
function initSavedDesigns() {
    updateSavedCount();

    const savedLink = document.querySelector('.saved-designs-link');
    if (savedLink) {
        savedLink.addEventListener('click', function (e) {
            e.preventDefault();
            showSavedDesignsModal();
        });
    }
}

function showSavedDesignsModal() {
    const saved = getSavedDesigns();

    // Remove existing modal if any
    const existingModal = document.getElementById('saved-designs-modal');
    if (existingModal) existingModal.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'saved-designs-modal';
    modal.className = 'saved-modal-overlay';

    let itemsHtml = '';
    if (saved.length === 0) {
        itemsHtml = '<p class="saved-modal-empty">You have no saved designs yet. Click the heart icon on any product to save it.</p>';
    } else {
        // Find product details for each saved item
        const allProducts = [...(productsData?.materials || []), ...(productsData?.sinks || [])];

        saved.forEach(productId => {
            const product = allProducts.find(p => p['Color Name'] === productId || p.Model === productId);
            if (product) {
                const name = product['Color Name'] || product.Model;
                const image = product['Image URL'];
                const brand = product.Brand || `${product.Series} Series`;
                itemsHtml += `
                    <div class="saved-item">
                        <img src="${image}" alt="${name}" class="saved-item-image">
                        <div class="saved-item-info">
                            <h4>${name}</h4>
                            <p>${brand}</p>
                        </div>
                        <button class="saved-item-remove" data-product-id="${productId}" aria-label="Remove">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                `;
            }
        });
    }

    modal.innerHTML = `
        <div class="saved-modal-content">
            <div class="saved-modal-header">
                <h2>My Saved Designs</h2>
                <button class="saved-modal-close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="saved-modal-body">
                ${itemsHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close button handler
    modal.querySelector('.saved-modal-close').addEventListener('click', () => modal.remove());

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Remove item handlers
    modal.querySelectorAll('.saved-item-remove').forEach(btn => {
        btn.addEventListener('click', function () {
            const productId = this.dataset.productId;
            removeSavedDesign(productId);
            // Update heart buttons on page
            document.querySelectorAll(`.save-heart-btn[data-product-id="${productId}"]`).forEach(heart => {
                heart.classList.remove('saved');
                heart.querySelector('svg').setAttribute('fill', 'none');
            });
            // Refresh modal
            showSavedDesignsModal();
        });
    });
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

// Filter toggle for collapsible filter section
function toggleFilters() {
    const filterContent = document.getElementById('filter-content');
    const filterArrow = document.querySelector('.filter-arrow');

    if (filterContent) {
        const isCollapsed = filterContent.style.maxHeight === '0px';
        if (isCollapsed) {
            filterContent.style.maxHeight = '500px';
            filterContent.style.marginTop = 'var(--spacing-sm)';
            if (filterArrow) filterArrow.style.transform = 'rotate(0deg)';
        } else {
            filterContent.style.maxHeight = '0px';
            filterContent.style.marginTop = '0';
            if (filterArrow) filterArrow.style.transform = 'rotate(-90deg)';
        }
    }
}

// Make toggleFilters available globally
window.toggleFilters = toggleFilters;

// Debug logging
console.log('Judestone script loaded, path:', window.location.pathname);

function removeSavedDesign(productId) {
    const saved = getSavedDesigns();
    const filtered = saved.filter(id => id !== productId);
    localStorage.setItem('judestone_saved_designs', JSON.stringify(filtered));
    updateSavedCount();
}
