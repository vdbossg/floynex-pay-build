const puppeteer = require("puppeteer");

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath:
        "/home/u634840695/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding"
      ]
    });

    console.log("✅ Puppeteer browser started once");
  }

  return browser;
}

module.exports = { getBrowser };
