const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set viewport to desktop size
    await page.setViewportSize({ width: 1440, height: 900 });

    try {
        console.log('Navigating to http://localhost:5174...');
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 });

        // Wait an extra second for 3D to render completely
        await page.waitForTimeout(2000);

        const screenshotPath = path.join(__dirname, 'test-results', 'hero-3d.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);
    } catch (error) {
        console.error('Error during screenshot capture:', error);
    } finally {
        await browser.close();
    }
})();
