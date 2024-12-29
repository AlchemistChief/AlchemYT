const puppeteer = require('puppeteer');
const fs = require('fs');

// Function to log into YouTube and save cookies
const loginToYouTube = async () => {
    const browser = await puppeteer.launch({ headless: false }); // Set headless mode to false for debugging
    const page = await browser.newPage();

    // Open YouTube
    await page.goto('https://www.youtube.com');

    // Click on 'Sign in' button to go to the Google login page
    await page.waitForSelector('button[aria-label="Sign in"]');
    await page.click('button[aria-label="Sign in"]');

    // Wait for email input field
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'thelegionserveraccess@gmail.com');
    await page.click('button[jsname="LgbsSe"]');

    // Wait for the password page
    await page.waitForSelector('input[type="password"]');
    await page.waitForTimeout(2000); // Give it more time to load the password input
    await page.type('input[type="password"]', 'Adm!n!strat!v3S3rv3r');
    await page.click('button[jsname="LgbsSe"]');

    // Wait for any redirects after login, like 2FA or additional steps (optional)
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Wait for the cookies to be set
    await page.waitForTimeout(5000); 

    // Get the cookies and save them to a file
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));

    console.log('Cookies saved!');
    await browser.close();
};

loginToYouTube().catch(console.error);
