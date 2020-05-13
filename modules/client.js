'use strict';
//https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-class-puppeteer
const puppeteer = require('puppeteer');

const parser = require('./parser');

// these must be lower case
const _resourceTypesToNotLoad = [
	'image',
	'media',
	'font'
];

let _browser;

const api = {
	openBrowser: async config => {
		_browser = await puppeteer.launch(config);
	},

	closeBrowser: async () => {
		await _browser.close(); // once closed it can no longer be used
	},

	surf: async location => {
		let requestedUrlStatus;
		let page;

		try {
			page = await _browser.newPage();
			// setRequestInterceptionenables request.abort, request.continue & request.respond methods
			await page.setRequestInterception(true);
		} catch (error) {
			console.error(error)
		}

		// event fires when browser requests another resource
		page.on('request', request => {
			const lcResouceType = request.resourceType().toLowerCase();
			if (_resourceTypesToNotLoad.includes(lcResouceType)) {
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
		const hrefs = await parser.getMatchingOriginUrls(location);
		const cookies = await parser.getCookies();
		await page.close();

		return {
			requestedUrlStatus: requestedUrlStatus,
			hrefs: hrefs,
			cookies: cookies
		}
	}
};

module.exports = api;
