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
    } else if (path.includes('materials') || path.includes('quartz-designs') || path.endsWith('/') || path.includes('index')) {
        initMaterialsGallery();
    }

    // Homepage hero: cycle a random slab behind the headline
    initHeroSlideshow();

    // Initialize mobile menu
    initMobileMenu();

    // Initialize saved designs
    initSavedDesigns();

    // Initialize email signup (Formspree)
    initEmailSignup();
});

// Email Signup (Formspree) - AJAX submit to stay on page
function initEmailSignup() {
    document.querySelectorAll('form.email-signup').forEach(function (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Signing up...';

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    btn.textContent = 'Thanks!';
                    form.querySelector('input[name="email"]').value = '';
                } else {
                    const data = await response.json();
                    throw new Error(data.error || 'Something went wrong');
                }
            } catch (err) {
                btn.textContent = originalText;
                btn.disabled = false;
                alert(err.message || 'Something went wrong. Please try again.');
            }
        });
    });
}

// Homepage hero slideshow: cycles a random slab from the live catalogue, so
// the hero can never point at a design that has been discontinued.
function initHeroSlideshow() {
    const stage = document.querySelector('.js-hero-bg');
    if (!stage || !productsData || !productsData.materials || !productsData.materials.length) return;

    const pool = productsData.materials.slice();
    for (let i = pool.length - 1; i > 0; i--) {          // shuffle once per load
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const caption = document.querySelector('.js-hero-shown');
    const layers = [document.createElement('img'), document.createElement('img')];
    layers.forEach((img, i) => {
        img.className = 'js-hero-slide' + (i === 0 ? ' is-active' : '');
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        stage.appendChild(img);
    });

    let index = 0, front = 0;
    const show = (item, img) => {
        img.src = item['Image URL'];
        img.alt = item['Color Name'] + ' ' + item.Material.toLowerCase() + ' slab';
        if (caption) caption.textContent = 'Shown: ' + item['Color Name'] + ' ' + item.Material.toLowerCase();
    };

    show(pool[0], layers[0]);
    stage.querySelectorAll('img:not(.js-hero-slide)').forEach(el => el.remove());

    if (pool.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setInterval(() => {
        index = (index + 1) % pool.length;
        const back = 1 - front;
        const img = layers[back];
        const next = pool[index];
        const pre = new Image();
        pre.onload = () => {                              // only cross-fade once decoded
            show(next, img);
            layers[front].classList.remove('is-active');
            img.classList.add('is-active');
            front = back;
        };
        pre.src = next['Image URL'];
    }, 6000);
}

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

// Colour tags get their own filter row; everything else is a "look" chip.
const COLOUR_TAGS = ['White', 'Grey', 'Black', 'Beige', 'Brown', 'Cream', 'Gold'];

// Structural tags carry data shown elsewhere on the card, so they are not
// repeated as descriptive chips.
const STRUCTURAL_TAGS = /^(Quartz|Granite|Upgrade|Group \d+|Kitchen|Bath|Undermount|Stainless Steel|Porcelain)$/i;

function displayTags(tagStr) {
    if (!tagStr) return [];
    return tagStr.split(';').map(t => t.trim()).filter(t => t && !STRUCTURAL_TAGS.test(t));
}

// 'Imperial Pearl' exists in both quartz and granite, so a material is
// identified by its qualified slug rather than by colour name alone.
function productKey(product, type) {
    if (type === 'material') return product.Slug || product['Color Name'];
    return product.Model;
}

function groupLabel(product) {
    return 'Group ' + product.Group + (product.Upgrade === 'Yes' ? ' Upgrade' : '');
}

// Materials Gallery (quartz + granite in one book)
function initMaterialsGallery() {
    if (!productsData || !productsData.materials) return;

    const filterBar = document.querySelector('.filter-bar');
    const productGrid = document.querySelector('.product-grid');
    const sortSelect = document.querySelector('.sort-select');

    if (!filterBar || !productGrid) return;

    createMaterialFilters(filterBar, productsData.materials, productsData.materialFilters || []);

    // Deep links such as /materials/?material=Granite preselect a filter row
    const params = new URLSearchParams(window.location.search);
    ['material', 'group', 'colour', 'look'].forEach(dim => {
        const wanted = params.get(dim);
        if (!wanted) return;
        const btn = filterBar.querySelector('[data-filter="' + dim + '"][data-value="' + CSS.escape(wanted) + '"]');
        if (!btn) return;
        btn.closest('.filter-group').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });

    const apply = () => {
        const pick = (dim) => {
            const btn = filterBar.querySelector('[data-filter="' + dim + '"].active');
            return btn ? btn.dataset.value : 'ALL';
        };
        let out = filterMaterials(productsData.materials, {
            material: pick('material'),
            group: pick('group'),
            colour: pick('colour'),
            look: pick('look')
        });
        out = sortProducts(out, sortSelect ? sortSelect.value : 'recommended');
        renderProducts(productGrid, out, 'material');
        updateResultCount(out.length, productsData.materials.length);
    };

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('.filter-group');
            row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            apply();
        });
    });

    if (sortSelect) sortSelect.addEventListener('change', apply);

    apply();
}

// Build the four filter rows: material, group, colour, look
function createMaterialFilters(container, materials, allTags) {
    const wrap = container.querySelector('.filter-container');
    if (!wrap) return;

    const row = (label, values) => {
        const group = document.createElement('div');
        group.className = 'filter-group';
        const tag = document.createElement('span');
        tag.className = 'filter-group-label';
        tag.textContent = label + ':';
        group.appendChild(tag);
        values.forEach((v, i) => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
            btn.textContent = v.label;
            btn.dataset.value = v.value;
            btn.dataset.filter = v.dim;
            group.appendChild(btn);
        });
        wrap.appendChild(group);
    };

    const opts = (dim, values) =>
        [{ dim, value: 'ALL', label: 'All' }].concat(values.map(v => ({ dim, value: v, label: v })));

    const materialsList = [...new Set(materials.map(m => m.Material))];
    const groups = [...new Set(materials.map(m => m.Group))].sort();
    const colours = COLOUR_TAGS.filter(c => allTags.includes(c));
    const looks = allTags.filter(t => !COLOUR_TAGS.includes(t));

    row('Material', opts('material', materialsList));
    row('Group', opts('group', groups));
    row('Colour', opts('colour', colours));
    row('Look', opts('look', looks));
}

function updateResultCount(shown, total, noun) {
    const el = document.querySelector('.js-result-count');
    if (!el) return;
    const word = noun || 'designs';
    el.textContent = shown === total ? total + ' ' + word : shown + ' of ' + total + ' ' + word;
}

// Filter materials across the four dimensions
function filterMaterials(materials, f) {
    return materials.filter(m => {
        if (f.material !== 'ALL' && m.Material !== f.material) return false;
        if (f.group !== 'ALL' && m.Group !== f.group) return false;
        const tags = m.Tag ? m.Tag.split(';').map(t => t.trim().toLowerCase()) : [];
        if (f.colour !== 'ALL' && !tags.includes(f.colour.toLowerCase())) return false;
        if (f.look !== 'ALL' && !tags.includes(f.look.toLowerCase())) return false;
        return true;
    });
}

// Sinks Gallery
function initSinksGallery() {
    if (!productsData || !productsData.sinks) return;

    const filterBar = document.querySelector('.filter-bar');
    const productGrid = document.querySelector('.product-grid');
    const sortSelect = document.querySelector('.sort-select');

    if (!filterBar || !productGrid) return;

    const categories = [...new Set(productsData.sinks.map(s => s.Category))];
    const series = [...new Set(productsData.sinks.map(s => s.Series))];
    const configs = [...new Set(productsData.sinks.map(s => s.Configuration))].filter(Boolean);

    createSinkFilters(filterBar, categories, series, configs);

    const apply = () => {
        const pick = (dim) => {
            const btn = filterBar.querySelector('[data-filter="' + dim + '"].active');
            return btn ? btn.dataset.value : 'ALL';
        };
        let out = filterSinks(productsData.sinks, pick('category'), pick('series'), pick('config'));
        out = sortProducts(out, sortSelect ? sortSelect.value : 'recommended');
        renderProducts(productGrid, out, 'sink');
        updateResultCount(out.length, productsData.sinks.length, 'models');
    };

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('.filter-group');
            row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            apply();
        });
    });

    if (sortSelect) sortSelect.addEventListener('change', apply);

    apply();
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

// Create Sink Filters: room, material, and bowl configuration
function createSinkFilters(container, categories, series, configs) {
    const wrap = container.querySelector('.filter-container');
    if (!wrap) return;

    const row = (label, dim, values) => {
        const group = document.createElement('div');
        group.className = 'filter-group';
        const tag = document.createElement('span');
        tag.className = 'filter-group-label';
        tag.textContent = label + ':';
        group.appendChild(tag);
        ['ALL'].concat(values).forEach((v, i) => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (i === 0 ? ' active' : '');
            btn.textContent = v === 'ALL' ? 'All' : v;
            btn.dataset.value = v;
            btn.dataset.filter = dim;
            group.appendChild(btn);
        });
        wrap.appendChild(group);
    };

    row('Room', 'category', categories);
    row('Material', 'series', series);
    row('Configuration', 'config', configs);
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
function filterSinks(sinks, category, series, config) {
    let filtered = sinks;

    if (category && category !== 'ALL') {
        filtered = filtered.filter(s => s.Category === category);
    }

    if (series && series !== 'ALL') {
        filtered = filtered.filter(s => s.Series === series);
    }

    if (config && config !== 'ALL') {
        filtered = filtered.filter(s => s.Configuration === config);
    }

    return filtered;
}

// Group ordering: quartz before granite, then group number, then upgrade tier last
// within its group, so "3" and "3 Upgrade" stay adjacent instead of interleaving.
function materialRank(m) {
    const material = m.Material === 'Granite' ? 1 : 0;
    const group = parseInt(m.Group || '0', 10) || 0;
    const upgrade = m.Upgrade === 'Yes' ? 1 : 0;
    return material * 1000 + group * 10 + upgrade;
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
        case 'group-asc':
            return sorted.sort((a, b) => materialRank(a) - materialRank(b));
        case 'group-desc':
            return sorted.sort((a, b) => materialRank(b) - materialRank(a));
        case 'recommended':
        default:
            // Catalogue order: quartz groups 1-6 then granite, upgrades after
            // their base group. Sinks keep sheet order.
            return sorted[0] && sorted[0].Material
                ? sorted.sort((a, b) => materialRank(a) - materialRank(b))
                : sorted;
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

    const productId = productKey(product, type);
    const isSaved = isDesignSaved(productId);

    if (type === 'material') {
        card.innerHTML = `
            <div class="product-card-image-wrapper">
                <img src="${product['Image URL']}" alt="${product['Color Name']} ${product.Material.toLowerCase()} slab" class="product-card-image" loading="lazy">
                ${product.Upgrade === 'Yes' ? '<span class="js-upgrade-badge">Upgrade</span>' : ''}
                <button class="save-heart-btn ${isSaved ? 'saved' : ''}" data-product-id="${productId}" aria-label="Save design">
                    <svg viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="product-card-content">
                <h3 class="product-card-title">${product['Color Name']}</h3>
                <div class="product-card-brand">${product.Material} &middot; ${groupLabel(product)} &middot; ${product.Finish}</div>
                <p class="product-card-description">${product['Short Description']}</p>
                <div class="product-card-tags">
                    ${product.Tag ? displayTags(product.Tag).slice(0, 3).map(tag =>
            `<span class="tag">${tag}</span>`
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
                <div class="product-card-brand">${product.Series} &middot; ${product.Type} &middot; ${product.Configuration}</div>
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
    const productId = productKey(product, type);
    const encodedId = encodeURIComponent(productId);

    window.location.href = `/product/?type=${type}&id=${encodedId}`;
}

// Show Product Detail Modal
function showProductDetail(product, type) {
    // Remove existing modal if any
    const existingModal = document.getElementById('product-detail-modal');
    if (existingModal) existingModal.remove();

    const productId = productKey(product, type);
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
                <div class="detail-brand">${product.Material} &middot; ${groupLabel(product)} &middot; ${product.Finish}</div>
                <div class="detail-meta">
                    <span class="detail-meta-item">${groupLabel(product)}</span>
                    <span class="detail-meta-item">${product.Thickness || '2cm, 3cm'}</span>
                    <span class="detail-meta-item">${product['Slab Size'] || ''}</span>
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
        const rows = [
            ['Configuration', product.Configuration],
            ['Overall size', product['Size (L x W x H)']],
            ['Interior size', product['Interior Dimension']],
            ['Construction', product.Construction]
        ];
        let specsHtml = '<div class="sink-specs">';
        rows.forEach(([label, value]) => {
            if (value) specsHtml += `<div class="spec-row"><span class="spec-label">${label}:</span><span class="spec-value">${value}</span></div>`;
        });
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
                <div class="detail-brand">${product.Series} • ${product.Type} • ${product.Category}</div>
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
            const product = allProducts.find(p => (p.Slug || p['Color Name']) === productId || p.Model === productId);
            if (product) {
                const name = product['Color Name'] || product.Model;
                const image = product['Image URL'];
                const brand = product.Group ? groupLabel(product) : product.Series;
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
            // Measured, not fixed: the material book has four filter rows and the
            // "Look" row alone wraps to several lines on narrow viewports.
            filterContent.style.maxHeight = filterContent.scrollHeight + 'px';
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
        product = productsData.materials.find(m => (m.Slug || m['Color Name']) === productId);
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
                <a href="/materials/" class="btn btn-primary">Browse materials</a>
                <a href="/sinks/" class="btn btn-secondary">Browse Sinks</a>
            </div>
        `;
    }
}

function updateBreadcrumb(product, type) {
    const categoryLink = document.getElementById('category-link');
    const productName = document.getElementById('product-name');

    if (type === 'material') {
        categoryLink.href = '/materials/';
        categoryLink.textContent = 'Materials';
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

    const productId = productKey(product, type);
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
                <div class="product-page-subtitle">${product.Material} &middot; ${groupLabel(product)} &middot; ${product.Finish}</div>

                <div class="product-page-specs">
                    <div class="spec-item">
                        <span class="spec-label">Material</span>
                        <span class="spec-value">${product.Material}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Group</span>
                        <span class="spec-value">${groupLabel(product).replace('Group ', '')}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Thickness</span>
                        <span class="spec-value">${product.Thickness || '2cm, 3cm'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Slab size</span>
                        <span class="spec-value">${product['Slab Size'] || '-'}</span>
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
        [
            ['Configuration', product.Configuration],
            ['Overall size', product['Size (L x W x H)']],
            ['Interior size', product['Interior Dimension']],
            ['Construction', product.Construction]
        ].forEach(([label, value]) => {
            if (!value) return;
            specsHtml += `
                <div class="spec-item">
                    <span class="spec-label">${label}</span>
                    <span class="spec-value">${value}</span>
                </div>
            `;
        });

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
                <div class="product-page-subtitle">${product.Series} • ${product.Type} • ${product.Category}</div>
                
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
        // Same material and group - quartz Group 1 and granite Group 1 are
        // different price tiers, so they must not be shown as alternatives.
        const key = productKey(product, type);
        related = productsData.materials
            .filter(m => productKey(m, type) !== key &&
                m.Material === product.Material &&
                m.Group === product.Group)
            .slice(0, 4);
        // Fall back to the rest of the same material if the group is thin
        if (related.length < 4) {
            const have = new Set(related.map(m => productKey(m, type)).concat([key]));
            related = related.concat(productsData.materials
                .filter(m => m.Material === product.Material && !have.has(productKey(m, type)))
                .slice(0, 4 - related.length));
        }
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
        const material = productsData.materials.find(m => (m.Slug || m['Color Name']) === productId);
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
                        <span class="compare-spec-label">Material</span>
                        <span class="compare-spec-value">${product.Material}</span>
                    </div>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Group</span>
                        <span class="compare-spec-value">${groupLabel(product).replace('Group ', '')}</span>
                    </div>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Thickness</span>
                        <span class="compare-spec-value">${product.Thickness || '2cm, 3cm'}</span>
                    </div>
                    <div class="compare-spec">
                        <span class="compare-spec-label">Slab size</span>
                        <span class="compare-spec-value">${product['Slab Size'] || '-'}</span>
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
        const sinkSpecs = [
            ['Material', product.Series],
            ['Type', product.Type],
            ['Configuration', product.Configuration],
            ['Overall size', product['Size (L x W x H)']],
            ['Interior size', product['Interior Dimension']],
            ['Construction', product.Construction]
        ].filter(([, v]) => v).map(([label, value]) => `
                    <div class="compare-spec">
                        <span class="compare-spec-label">${label}</span>
                        <span class="compare-spec-value">${value}</span>
                    </div>`).join('');

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
                    ${sinkSpecs}
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
        product = productsData.materials.find(m => (m.Slug || m['Color Name']) === productId);
    } else {
        product = productsData.sinks.find(s => s.Model === productId);
    }

    if (product && !items.some(p =>
        productKey(p, compareState.type) === productId
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
            const id = productKey(product, compareState.type);
            const name = compareState.type === 'material' ? product['Color Name'] : product.Model;
            const subtitle = compareState.type === 'material'
                ? `${groupLabel(product)} • ${product.Finish}`
                : `${product.Series} • ${product.Type}`;
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
            product = productsData.materials.find(m => (m.Slug || m['Color Name']) === productId);
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
