'use strict';

const puppeteer = require('puppeteer');

const parser = require('./parser');

// these must be lower case
const resourceTypesToNotLoad = [
	'image',
	'media',
	'font'
];

let browser;

const api = {
	surf: async location => {
		if (!browser) {
			// https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-class-puppeteer
			browser = await puppeteer.launch({
				headless: true,
				slowMo: 200,
			});
		}

		let requestedUrlStatus;
		const page = await browser.newPage();
		await page.setRequestInterception(true);

		// event fires when browser requests another resource
		page.on('request', request => {
			const lcResouceType = request.resourceType().toLowerCase();
			if (resourceTypesToNotLoad.includes(lcResouceType)) {
				request.abort(); // TODO: nicer to do this earlier in event loop?
			}
			else {
				request.continue();
			}
		});

		// event fires when browser fails to load another resource
		page.on('requestfailed', request => {
			// aborting requests (above) will result in failures
		});

		// event fires when browser gets a request response
		page.on('response', response => {
			const thisUrl = response.url();
			let parsedUrl;
			try {
				parsedUrl = new URL(thisUrl);
				const status = response.status();
				if (parsedUrl.href === location.href
						&& (status < 300 || status >= 400)
					)
				{
					requestedUrlStatus = status;
				}
			} catch (error) {
				// invalid URL found
				console.warn(`invalid URL ${thisUrl}`);
			}
		});

		await page.goto(location);
		await page.content();
		parser.init(page);
		const hrefs = await parser.getLinkUrls(location);
		await browser.close();

		return {
			requestedUrlStatus: requestedUrlStatus,
			hrefs: hrefs
		}
	}
};

module.exports = api;
