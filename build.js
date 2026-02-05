const fs = require('fs-extra');
const path = require('path');

/** Read file as string, auto-detect UTF-16/UTF-8, return UTF-8 string (for GitHub Pages) */
function readAsUtf8(filePath) {
    const buf = fs.readFileSync(filePath);
    if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
        return buf.toString('utf16le');
    }
    if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF) {
        return buf.toString('utf16be');
    }
    // UTF-16 LE without BOM (e.g. Windows): alternating null bytes in ASCII range
    if (buf.length >= 4 && buf[1] === 0 && buf[3] === 0 && buf[0] < 128 && buf[2] < 128) {
        return buf.toString('utf16le');
    }
    let str = buf.toString('utf8');
    if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
    return str;
}

async function copyPagesAsUtf8(srcDir, destDir) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const e of entries) {
        const srcPath = path.join(srcDir, e.name);
        const destPath = path.join(destDir, e.name);
        if (e.isDirectory()) {
            await fs.ensureDir(destPath);
            await copyPagesAsUtf8(srcPath, destPath);
        } else if (e.name.endsWith('.html')) {
            const content = readAsUtf8(srcPath);
            await fs.writeFile(destPath, content, 'utf8');
        } else {
            await fs.copy(srcPath, destPath);
        }
    }
}

async function build() {
    try {
        // Create dist directory
        await fs.ensureDir('dist');

        // Copy src/pages to dist, normalizing HTML to UTF-8 (fixes GitHub Pages encoding)
        await copyPagesAsUtf8('src/pages', 'dist');

        // Copy src/assets to dist/assets
        await fs.copy('src/assets', 'dist/assets');

        // Copy images to dist/images
        if (await fs.pathExists('images')) {
            await fs.copy('images', 'dist/images');
        }

        // Copy brand assets folder to dist/assets/brand
        if (await fs.pathExists('assets/brand')) {
            await fs.ensureDir('dist/assets/brand');
            await fs.copy('assets/brand', 'dist/assets/brand');
        }

        // Generate favicon files from logo if ImageMagick is available
        const { execSync } = require('child_process');

        try {
            execSync('magick --version', { stdio: 'ignore' });

            // Find logo file
            const brandDir = 'assets/brand';
            if (await fs.pathExists(brandDir)) {
                const files = await fs.readdir(brandDir);
                const logoFile = files.find(f => f.match(/\.(svg|png|jpg|jpeg)$/i));

                if (logoFile) {
                    const logoPath = path.join(brandDir, logoFile);
                    console.log('ImageMagick found - generating favicon files...');
                    execSync(`magick "${logoPath}" -strip -quality 90 -resize 32x32^ -gravity center -extent 32x32 "dist/favicon-32x32.png"`);
                    execSync(`magick "${logoPath}" -strip -quality 90 -resize 16x16^ -gravity center -extent 16x16 "dist/favicon-16x16.png"`);
                    execSync(`magick "${logoPath}" -strip -quality 90 -resize 180x180^ -gravity center -extent 180x180 "dist/apple-touch-icon.png"`);
                    execSync(`magick "${logoPath}" -strip -quality 90 -resize 192x192^ -gravity center -extent 192x192 "dist/android-chrome-192x192.png"`);
                    execSync(`magick "${logoPath}" -strip -quality 90 -resize 512x512^ -gravity center -extent 512x512 "dist/android-chrome-512x512.png"`);
                    console.log('Favicon files generated successfully!');
                }
            }
        } catch (error) {
            console.log('ImageMagick not available - skipping favicon generation');
        }

        // Copy configuration files
        const configFiles = ['CNAME', 'robots.txt', 'site.webmanifest', 'sitemap.xml'];
        for (const file of configFiles) {
            if (await fs.pathExists(file)) {
                await fs.copy(file, `dist/${file}`);
            }
        }

        console.log('Build completed successfully!');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
