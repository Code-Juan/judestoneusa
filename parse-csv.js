const fs = require('fs');
const path = require('path');

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            data.push(obj);
        }
    }
    
    return data;
}

// Parse Materials CSV
const materialsPath = path.join(__dirname, '..', '..', 'Judestone Files', 'JUDESTONE - Master SKU Sheet (Material).csv');
const materials = parseCSV(materialsPath);

// Parse Sinks CSV
const sinksPath = path.join(__dirname, '..', '..', 'Judestone Files', 'JUDESTONE - Master SKU Sheet (Sinks).csv');
const sinks = parseCSV(sinksPath);

// Extract filter categories from tags
function extractFilters(items, tagColumn) {
    const filters = new Set();
    items.forEach(item => {
        if (item[tagColumn]) {
            const tags = item[tagColumn].split(';').map(t => t.trim());
            tags.forEach(tag => {
                if (tag && !tag.match(/^(Quartz|Group \d+|Kitchen|Bath)$/i)) {
                    filters.add(tag);
                }
            });
        }
    });
    return Array.from(filters).sort();
}

const materialFilters = extractFilters(materials, 'Tag');
const sinkFilters = extractFilters(sinks, 'Tag');

// Generate JavaScript file
const jsContent = `// Product data generated from CSV files
// Do not edit manually - regenerate using: node parse-csv.js

const materials = ${JSON.stringify(materials, null, 2)};

const sinks = ${JSON.stringify(sinks, null, 2)};

const materialFilters = ${JSON.stringify(materialFilters, null, 2)};

const sinkFilters = ${JSON.stringify(sinkFilters, null, 2)};

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { materials, sinks, materialFilters, sinkFilters };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.productsData = { materials, sinks, materialFilters, sinkFilters };
}
`;

fs.writeFileSync(path.join(__dirname, 'src', 'assets', 'products-data.js'), jsContent);
console.log('✅ Generated products-data.js');
console.log(`   Materials: ${materials.length} items`);
console.log(`   Sinks: ${sinks.length} items`);
console.log(`   Material filters: ${materialFilters.length} categories`);
console.log(`   Sink filters: ${sinkFilters.length} categories`);
