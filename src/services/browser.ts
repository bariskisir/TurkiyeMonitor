// Manages the shared Puppeteer browser instance for JavaScript-rendered sources.

import puppeteer, { type Browser } from 'puppeteer';

let browser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

/** Returns a shared Puppeteer browser instance for all scraping tasks. */
export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu'],
      })
      .then((launchedBrowser) => {
        browser = launchedBrowser;
        return launchedBrowser;
      });
  }

  return browserPromise;
}

/** Closes the shared browser instance when collection completes. */
export async function closeBrowser(): Promise<void> {
  if (!browser) {
    return;
  }

  try {
    await browser.close();
  } catch {
    // Browser shutdown failures are non-critical after data collection finishes.
  } finally {
    browser = null;
    browserPromise = null;
  }
}

/** Scrapes a browser-rendered page with an isolated tab and cache-busted URL. */
export async function scrape<T>(url: string, evaluatePage: () => T, waitSelector?: string): Promise<T> {
  const activeBrowser = await getBrowser();
  const page = await activeBrowser.newPage();

  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    const separator = url.includes('?') ? '&' : '?';
    await page.goto(`${url}${separator}timestamp=${Date.now()}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 15000 });
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    const result = await page.evaluate(evaluatePage);

    if (result === null || result === undefined) {
      throw new Error(`Scrape returned null or undefined for ${url}`);
    }

    return result;
  } finally {
    await page.close();
  }
}
