const fs = require('fs-extra');
const path = require('path');

async function build() {
    try {
        // Create dist directory
        await fs.ensureDir('dist');

        // Copy src/pages to dist
        await fs.copy('src/pages', 'dist');

        // Copy src/assets to dist/assets
        await fs.copy('src/assets', 'dist/assets');

        // Copy images to dist/images
        if (await fs.pathExists('images')) {
            await fs.copy('images', 'dist/images');
        }

        // Copy logo files to dist if they exist
        if (await fs.pathExists('assets/brand')) {
            const brandFiles = await fs.readdir('assets/brand');
            for (const file of brandFiles) {
                if (file.match(/\.(svg|png|jpg|jpeg|ico)$/i)) {
                    await fs.copy(`assets/brand/${file}`, `dist/${file}`);
                }
            }
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
