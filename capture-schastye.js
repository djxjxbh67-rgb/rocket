const { chromium } = require('playwright');

(async () => {
    console.log("Launching browser...");
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });

    console.log("Navigating to https://djxjxbh67-rgb.github.io/kuhni/");
    await page.goto('https://djxjxbh67-rgb.github.io/kuhni/', { waitUntil: 'networkidle' });

    console.log("Scrolling the page to load lazy images...");
    // Scroll down slowly to trigger lazy loading
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });

    console.log("Waiting for images to settle...");
    await page.waitForTimeout(3000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    console.log("Taking full page screenshot...");
    await page.screenshot({ path: 'images/furniture-mockup.png', fullPage: true });

    console.log("Done.");
    await browser.close();
})();
