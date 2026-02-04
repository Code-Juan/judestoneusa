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

    if (path.includes('/compare/') || path.includes('/compare')) {
        initComparePage();
    } else if (path.includes('/product/') || path.includes('/product')) {
        initProductDetailPage();
    } else if (path.includes('sinks')) {
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
                <div class="product-card-brand">Group ${product.Group} • ${product.Finish}</div>
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

    // Add click handler to navigate to product detail page
    card.addEventListener('click', function () {
        navigateToProductPage(product, type);
    });

    // Make card appear clickable
    card.style.cursor = 'pointer';

    return card;
}

// Navigate to product detail page
function navigateToProductPage(product, type) {
    const productId = type === 'material' ? product['Color Name'] : product.Model;
    const encodedId = encodeURIComponent(productId);

    window.location.href = `/product/?type=${type}&id=${encodedId}`;
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
                <div class="detail-brand">Group ${product.Group} • ${product.Finish}</div>
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

        // Build specifications section
        let specsHtml = '<div class="sink-specs">';

        // Show Gauge Options if there are gauge options available
        const gaugeOptions = product.Options ? product.Options.filter(opt => opt.toLowerCase().includes('gauge')) : [];
        if (gaugeOptions.length > 0) {
            specsHtml += `<div class="spec-row"><span class="spec-label">Gauge Options:</span><span class="spec-value">${gaugeOptions.join(', ')}</span></div>`;
        }
        if (product['Cabinet Base']) {
            specsHtml += `<div class="spec-row"><span class="spec-label">Cabinet Base:</span><span class="spec-value">${product['Cabinet Base']}</span></div>`;
        }
        if (product['Overall Dimension']) {
            specsHtml += `<div class="spec-row"><span class="spec-label">Overall Dimension:</span><span class="spec-value">${product['Overall Dimension']}</span></div>`;
        }
        if (product['Interior Dimension']) {
            specsHtml += `<div class="spec-row"><span class="spec-label">Interior Dimension:</span><span class="spec-value">${product['Interior Dimension']}</span></div>`;
        }

        specsHtml += '</div>';

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
                <div class="detail-brand">${product.Series} Series • ${product.Type} • ${product.Category}</div>
                ${specsHtml}
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
                const brand = product.Group ? `Group ${product.Group}` : `${product.Series} Series`;
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

    // Use absolute path for compare page
    const comparePath = '/compare/';

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
            <div class="saved-modal-footer">
                <a href="${comparePath}" class="btn btn-primary saved-compare-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path>
                        <rect x="9" y="3" width="6" height="4" rx="1"></rect>
                    </svg>
                    Compare Designs
                </a>
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

// Initialize Product Detail Page
function initProductDetailPage() {
    if (!productsData) return;

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const productId = urlParams.get('id');

    if (!type || !productId) {
        showProductNotFound();
        return;
    }

    // Find the product
    let product = null;
    if (type === 'material') {
        product = productsData.materials.find(m => m['Color Name'] === productId);
    } else if (type === 'sink') {
        product = productsData.sinks.find(s => s.Model === productId);
    }

    if (!product) {
        showProductNotFound();
        return;
    }

    // Update page title
    const productName = type === 'material' ? product['Color Name'] : product.Model;
    document.title = `${productName} - Judestone`;

    // Update breadcrumb
    updateBreadcrumb(product, type);

    // Render product detail
    renderProductDetailPage(product, type);

    // Load related products
    loadRelatedProducts(product, type);
}

function showProductNotFound() {
    const container = document.getElementById('product-detail');
    if (container) {
        container.innerHTML = `
            <div class="product-not-found">
                <h2>Product Not Found</h2>
                <p>The product you're looking for doesn't exist or has been removed.</p>
                <a href="/quartz-designs/" class="btn btn-primary">Browse Quartz Designs</a>
                <a href="/sinks/" class="btn btn-secondary">Browse Sinks</a>
            </div>
        `;
    }
}

function updateBreadcrumb(product, type) {
    const categoryLink = document.getElementById('category-link');
    const productName = document.getElementById('product-name');

    if (type === 'material') {
        categoryLink.href = '/quartz-designs/';
        categoryLink.textContent = 'Quartz Designs';
        productName.textContent = product['Color Name'];
    } else if (type === 'sink') {
        categoryLink.href = '/sinks/';
        categoryLink.textContent = 'Sinks';
        productName.textContent = product.Model;
    }
}

function renderProductDetailPage(product, type) {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const productId = type === 'material' ? product['Color Name'] : product.Model;
    const isSaved = isDesignSaved(productId);

    let detailHtml = '';

    if (type === 'material') {
        const allTags = product.Tag ? product.Tag.split(';').map(tag =>
            `<span class="product-page-tag">${tag.trim()}</span>`
        ).join('') : '';

        detailHtml = `
            <div class="product-page-image">
                <img src="${product['Image URL']}" alt="${product['Color Name']}">
            </div>
            <div class="product-page-info">
                <div class="product-page-header">
                    <h1 class="product-page-title">${product['Color Name']}</h1>
                    <button class="product-page-save-btn ${isSaved ? 'saved' : ''}" data-product-id="${productId}">
                        <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="28" height="28">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-page-subtitle">Group ${product.Group} • ${product.Finish}</div>
                
                <div class="product-page-specs">
                    <div class="spec-item">
                        <span class="spec-label">Group</span>
                        <span class="spec-value">${product.Group}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Thickness</span>
                        <span class="spec-value">${product.Thickness ? product.Thickness.join(', ') : '2cm, 3cm'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Finish</span>
                        <span class="spec-value">${product.Finish}</span>
                    </div>
                </div>

                <div class="product-page-description">
                    <h3>Description</h3>
                    <p>${product['Short Description']}</p>
                </div>

                <div class="product-page-tags">
                    <h3>Tags</h3>
                    <div class="tags-list">${allTags}</div>
                </div>

                <div class="product-page-actions">
                    <a href="/contact/" class="btn btn-primary">Request a Quote</a>
                    <a href="/contact/" class="btn btn-secondary">Order Sample</a>
                </div>
            </div>
        `;
    } else if (type === 'sink') {
        const allTags = product.Tag ? product.Tag.split(';').map(tag =>
            `<span class="product-page-tag">${tag.trim()}</span>`
        ).join('') : '';

        // Build specifications
        let specsHtml = '';

        const gaugeOptions = product.Options ? product.Options.filter(opt => opt.toLowerCase().includes('gauge')) : [];
        if (gaugeOptions.length > 0) {
            specsHtml += `
                <div class="spec-item">
                    <span class="spec-label">Gauge Options</span>
                    <span class="spec-value">${gaugeOptions.join(', ')}</span>
                </div>
            `;
        }

        if (product['Cabinet Base']) {
            specsHtml += `
                <div class="spec-item">
                    <span class="spec-label">Cabinet Base</span>
                    <span class="spec-value">${product['Cabinet Base']}</span>
                </div>
            `;
        }

        if (product['Overall Dimension']) {
            specsHtml += `
                <div class="spec-item">
                    <span class="spec-label">Overall Dimension</span>
                    <span class="spec-value">${product['Overall Dimension']}</span>
                </div>
            `;
        }

        if (product['Interior Dimension']) {
            specsHtml += `
                <div class="spec-item">
                    <span class="spec-label">Interior Dimension</span>
                    <span class="spec-value">${product['Interior Dimension']}</span>
                </div>
            `;
        }

        detailHtml = `
            <div class="product-page-image">
                <img src="${product['Image URL']}" alt="${product.Model}">
            </div>
            <div class="product-page-info">
                <div class="product-page-header">
                    <h1 class="product-page-title">${product.Model}</h1>
                    <button class="product-page-save-btn ${isSaved ? 'saved' : ''}" data-product-id="${productId}">
                        <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="28" height="28">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-page-subtitle">${product.Series} Series • ${product.Type} • ${product.Category}</div>
                
                <div class="product-page-specs">
                    ${specsHtml}
                </div>

                <div class="product-page-description">
                    <h3>Description</h3>
                    <p>${product['Short Description']}</p>
                </div>

                <div class="product-page-tags">
                    <h3>Tags</h3>
                    <div class="tags-list">${allTags}</div>
                </div>

                <div class="product-page-actions">
                    <a href="/contact/" class="btn btn-primary">Request a Quote</a>
                    <a href="/contact/" class="btn btn-secondary">Contact Us</a>
                </div>
            </div>
        `;
    }

    container.innerHTML = detailHtml;

    // Add save button handler
    const saveBtn = container.querySelector('.product-page-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            const id = this.dataset.productId;
            toggleSaveDesign(id, this);
        });
    }
}

function loadRelatedProducts(product, type) {
    const section = document.getElementById('related-products');
    const grid = document.getElementById('related-grid');
    if (!section || !grid) return;

    let related = [];

    if (type === 'material') {
        // Get materials from same group
        related = productsData.materials
            .filter(m => m['Color Name'] !== product['Color Name'] &&
                m.Group === product.Group)
            .slice(0, 4);
    } else if (type === 'sink') {
        // Get sinks from same series or category
        related = productsData.sinks
            .filter(s => s.Model !== product.Model &&
                (s.Series === product.Series || s.Category === product.Category))
            .slice(0, 4);
    }

    if (related.length > 0) {
        section.style.display = 'block';
        grid.innerHTML = '';
        related.forEach(item => {
            const card = createProductCard(item, type);
            grid.appendChild(card);
        });
    }
}

// =====================================================
// COMPARISON PAGE FUNCTIONS
// =====================================================

// Current comparison state - stores items per type
let compareState = {
    type: 'material', // 'material' or 'sink'
    materialItems: [],  // Array of material product objects
    sinkItems: []       // Array of sink product objects
};

// Get current items based on active tab
function getCurrentCompareItems() {
    return compareState.type === 'material' ? compareState.materialItems : compareState.sinkItems;
}

// Set current items based on active tab
function setCurrentCompareItems(items) {
    if (compareState.type === 'material') {
        compareState.materialItems = items;
    } else {
        compareState.sinkItems = items;
    }
}

// Initialize Comparison Page
function initComparePage() {
    if (!productsData) return;

    // Get saved designs and categorize them
    const saved = getSavedDesigns();
    const savedMaterials = [];
    const savedSinks = [];

    saved.forEach(productId => {
        const material = productsData.materials.find(m => m['Color Name'] === productId);
        if (material) {
            savedMaterials.push(material);
            return;
        }
        const sink = productsData.sinks.find(s => s.Model === productId);
        if (sink) {
            savedSinks.push(sink);
        }
    });

    // Initialize both tabs with saved items
    compareState.materialItems = savedMaterials.slice(0, 4);
    compareState.sinkItems = savedSinks.slice(0, 4);

    // Determine default tab
    if (savedMaterials.length > 0) {
        compareState.type = 'material';
    } else if (savedSinks.length > 0) {
        compareState.type = 'sink';
    } else {
        // Default to materials with empty state
        compareState.type = 'material';
    }

    // Update tab UI
    updateCompareTabs();

    // Render comparison
    renderComparison();
}

// Switch between Materials and Sinks tabs
function switchCompareTab(type) {
    if (type === compareState.type) return;

    // Just switch the type - items are preserved in their respective arrays
    compareState.type = type;

    updateCompareTabs();
    renderComparison();
}

// Update tab UI to show active state
function updateCompareTabs() {
    const tabs = document.querySelectorAll('.compare-tab');
    tabs.forEach(tab => {
        if (tab.dataset.type === compareState.type) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Render the comparison grid
function renderComparison() {
    const grid = document.getElementById('compare-grid');
    const emptyState = document.getElementById('compare-empty');
    const items = getCurrentCompareItems();

    if (!grid) return;

    // Show/hide empty state
    if (items.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        // Remove floating add button if exists
        const existingFloatBtn = document.querySelector('.compare-add-floating');
        if (existingFloatBtn) existingFloatBtn.remove();
        return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    const itemCount = items.length;
    const canAddMore = itemCount < 4;

    // If only 1 item, show full-size add slot
    // If 2+ items, show small floating add button
    if (itemCount === 1) {
        grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
        grid.style.gridTemplateColumns = `repeat(${itemCount}, 1fr)`;
    }

    // Build comparison HTML
    let html = '';

    items.forEach((product, index) => {
        html += renderCompareItem(product, index);
    });

    // Add "Add Item" column only if there's 1 item
    if (itemCount === 1 && canAddMore) {
        html += `
            <div class="compare-item compare-add-item" onclick="showProductSelector()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                    <path d="M12 5v14M5 12h14"></path>
                </svg>
                <span>Add ${compareState.type === 'material' ? 'Material' : 'Sink'}</span>
            </div>
        `;
    }

    grid.innerHTML = html;

    // Handle floating add button for 2+ items
    let floatingBtn = document.querySelector('.compare-add-floating');
    if (itemCount >= 2 && canAddMore) {
        if (!floatingBtn) {
            floatingBtn = document.createElement('button');
            floatingBtn.className = 'compare-add-floating';
            floatingBtn.onclick = showProductSelector;
            floatingBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                    <path d="M12 5v14M5 12h14"></path>
                </svg>
                <span>Add ${compareState.type === 'material' ? 'Material' : 'Sink'}</span>
            `;
            grid.parentElement.appendChild(floatingBtn);
        } else {
            // Update text in case type changed
            floatingBtn.querySelector('span').textContent = `Add ${compareState.type === 'material' ? 'Material' : 'Sink'}`;
        }
    } else if (floatingBtn) {
        floatingBtn.remove();
    }

    // Add remove button handlers
    grid.querySelectorAll('.compare-remove-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            removeFromComparison(index);
        });
    });
}

// Render a single comparison item
function renderCompareItem(product, index) {
    if (compareState.type === 'material') {
        return `
            <div class="compare-item">
                <button class="compare-remove-btn" data-index="${index}" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                </button>
                <div class="compare-item-image">
                    <img src="${product['Image URL']}" alt="${product['Color Name']}">
                </div>
                <div class="compare-item-details">
                    <h3 class="compare-item-name">${product['Color Name']}</h3>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Group</span>
                        <span class="compare-spec-value">${product.Group}</span>
                    </div>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Thickness</span>
                        <span class="compare-spec-value">${product.Thickness ? product.Thickness.join(', ') : '2cm, 3cm'}</span>
                    </div>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Finish</span>
                        <span class="compare-spec-value">${product.Finish}</span>
                    </div>
                    <div class="compare-description">
                        <p>${product['Short Description']}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Sink
        const gaugeOptions = product.Options ? product.Options.filter(opt => opt.toLowerCase().includes('gauge')) : [];

        return `
            <div class="compare-item">
                <button class="compare-remove-btn" data-index="${index}" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                </button>
                <div class="compare-item-image">
                    <img src="${product['Image URL']}" alt="${product.Model}">
                </div>
                <div class="compare-item-details">
                    <h3 class="compare-item-name">${product.Model}</h3>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Series</span>
                        <span class="compare-spec-value">${product.Series} Series</span>
                    </div>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Type</span>
                        <span class="compare-spec-value">${product.Type}</span>
                    </div>
                    ${gaugeOptions.length > 0 ? `
                    <div class="compare-spec">
                        <span class="compare-spec-label">Gauge Options</span>
                        <span class="compare-spec-value">${gaugeOptions.join(', ')}</span>
                    </div>
                    ` : ''}
                    ${product['Cabinet Base'] ? `
                    <div class="compare-spec">
                        <span class="compare-spec-label">Cabinet Base</span>
                        <span class="compare-spec-value">${product['Cabinet Base']}</span>
                    </div>
                    ` : ''}
                    ${product['Overall Dimension'] ? `
                    <div class="compare-spec">
                        <span class="compare-spec-label">Overall Dimension</span>
                        <span class="compare-spec-value">${product['Overall Dimension']}</span>
                    </div>
                    ` : ''}
                    ${product['Interior Dimension'] ? `
                    <div class="compare-spec">
                        <span class="compare-spec-label">Interior Dimension</span>
                        <span class="compare-spec-value">${product['Interior Dimension']}</span>
                    </div>
                    ` : ''}
                    <div class="compare-description">
                        <p>${product['Short Description']}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Remove item from comparison
function removeFromComparison(index) {
    const items = getCurrentCompareItems();
    items.splice(index, 1);
    setCurrentCompareItems(items);
    renderComparison();
}

// Add item to comparison
function addToComparison(productId) {
    const items = getCurrentCompareItems();
    if (items.length >= 4) return;

    let product = null;
    if (compareState.type === 'material') {
        product = productsData.materials.find(m => m['Color Name'] === productId);
    } else {
        product = productsData.sinks.find(s => s.Model === productId);
    }

    if (product && !items.some(p =>
        (compareState.type === 'material' ? p['Color Name'] : p.Model) === productId
    )) {
        items.push(product);
        setCurrentCompareItems(items);
        renderComparison();
    }

    closeProductSelector();
}

// Selected items in product selector
let selectorSelectedIds = [];

// Show product selector modal
function showProductSelector() {
    const modal = document.getElementById('product-selector-modal');
    const body = document.getElementById('product-selector-body');
    const typeLabel = document.getElementById('selector-type-label');

    if (!modal || !body) return;

    // Reset selection
    selectorSelectedIds = [];

    // Calculate slots remaining
    const items = getCurrentCompareItems();
    const slotsRemaining = 4 - items.length;

    // Update label
    const typeName = compareState.type === 'material' ? 'Materials' : 'Sinks';
    typeLabel.textContent = `${typeName} (Select up to ${slotsRemaining})`;

    // Get products not already in comparison
    const currentIds = items.map(p =>
        compareState.type === 'material' ? p['Color Name'] : p.Model
    );

    let availableProducts = [];
    if (compareState.type === 'material') {
        availableProducts = productsData.materials.filter(m => !currentIds.includes(m['Color Name']));
    } else {
        availableProducts = productsData.sinks.filter(s => !currentIds.includes(s.Model));
    }

    // Render product list
    if (availableProducts.length === 0) {
        body.innerHTML = '<p class="selector-empty">No more items available to add.</p>';
    } else {
        body.innerHTML = availableProducts.map(product => {
            const id = compareState.type === 'material' ? product['Color Name'] : product.Model;
            const name = compareState.type === 'material' ? product['Color Name'] : product.Model;
            const subtitle = compareState.type === 'material'
                ? `Group ${product.Group} • ${product.Finish}`
                : `${product.Series} Series • ${product.Type}`;
            const image = product['Image URL'];

            return `
                <div class="selector-item" data-id="${id.replace(/"/g, '&quot;')}" onclick="toggleSelectorItem(this, '${id.replace(/'/g, "\\'")}')">
                    <div class="selector-checkbox">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="16" height="16">
                            <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                    </div>
                    <img src="${image}" alt="${name}" class="selector-item-image">
                    <div class="selector-item-info">
                        <h4>${name}</h4>
                        <p>${subtitle}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Add/update confirm button
    let footer = modal.querySelector('.selector-footer');
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'selector-footer';
        modal.querySelector('.product-selector-content').appendChild(footer);
    }
    updateSelectorFooter();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Toggle item selection in selector
function toggleSelectorItem(element, productId) {
    const items = getCurrentCompareItems();
    const slotsRemaining = 4 - items.length;
    const isSelected = selectorSelectedIds.includes(productId);

    if (isSelected) {
        // Deselect
        selectorSelectedIds = selectorSelectedIds.filter(id => id !== productId);
        element.classList.remove('selected');
    } else if (selectorSelectedIds.length < slotsRemaining) {
        // Select if we have room
        selectorSelectedIds.push(productId);
        element.classList.add('selected');
    }

    updateSelectorFooter();
}

// Update selector footer with count and confirm button
function updateSelectorFooter() {
    const footer = document.querySelector('.selector-footer');
    if (!footer) return;

    const count = selectorSelectedIds.length;
    if (count === 0) {
        footer.innerHTML = `<span class="selector-hint">Click items to select them</span>`;
    } else {
        footer.innerHTML = `
            <span class="selector-count">${count} item${count > 1 ? 's' : ''} selected</span>
            <button class="selector-confirm-btn" onclick="confirmSelectorSelection()">
                Add to Comparison
            </button>
        `;
    }
}

// Confirm and add all selected items
function confirmSelectorSelection() {
    const items = getCurrentCompareItems();

    selectorSelectedIds.forEach(productId => {
        if (items.length >= 4) return;

        let product = null;
        if (compareState.type === 'material') {
            product = productsData.materials.find(m => m['Color Name'] === productId);
        } else {
            product = productsData.sinks.find(s => s.Model === productId);
        }

        if (product) {
            items.push(product);
        }
    });

    setCurrentCompareItems(items);
    renderComparison();
    closeProductSelector();
}

// Close product selector modal
function closeProductSelector() {
    const modal = document.getElementById('product-selector-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        selectorSelectedIds = [];
    }
}

// Make functions available globally
window.switchCompareTab = switchCompareTab;
window.showProductSelector = showProductSelector;
window.closeProductSelector = closeProductSelector;
window.addToComparison = addToComparison;
window.toggleSelectorItem = toggleSelectorItem;
window.confirmSelectorSelection = confirmSelectorSelection;
