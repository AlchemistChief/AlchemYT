const puppeteer = require('puppeteer');
const fs = require('fs');

// Function to log into YouTube and save cookies
const loginToYouTube = async () => {
    const browser = await puppeteer.launch({ headless: true }); // Set headless mode
    const page = await browser.newPage();
    await page.goto('https://www.youtube.com');

    // Replace these selectors with the correct ones if they change
    await page.click('button[aria-label="Sign in"]');
    await page.type('input[type="email"]', 'your-email@example.com');
    await page.click('button[jsname="LgbsSe"]');
    await page.waitForTimeout(1000); // Wait for password page
    await page.type('input[type="password"]', 'your-password');
    await page.click('button[jsname="LgbsSe"]');
    await page.waitForNavigation(); // Wait for successful login

    // Wait for the cookies to be set after login
    await page.waitForTimeout(5000); 

    // Get the cookies and save them to a file
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));

    console.log('Cookies saved!');
    await browser.close();
};

loginToYouTube().catch(console.error);
