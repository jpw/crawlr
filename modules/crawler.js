'use strict';

const url = require('url');
const puppeteer = require('puppeteer');

const parser = require('./parser');
const reporter = require('./reporter');

// these must be lower case
const unloadedResourceTypes = [
	'image',
	'media',
	'font'
];

let requestedUrls = [];
let rootUrlStatus = 'NOT 200';

const api = {
	crawl: async rootUrl => {
		// https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-class-puppeteer
		const browser = await puppeteer.launch({
			headless: true,
			slowMo: 200,
		});

		const page = await browser.newPage();
		await page.setRequestInterception(true);

		// event fires when browser loads another resource
		page.on('request', request => {
			const lcResouceType = request.resourceType().toLowerCase();
			if (unloadedResourceTypes.includes(lcResouceType)) {
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

		page.on('response', response => {
			const thisUrl = response.url();
			let parsedUrl;
			try {
				parsedUrl = new URL(thisUrl);
				requestedUrls.push(thisUrl);
				console.log(`comapring ${parsedUrl.href} and ${rootUrl.href}`)
				if (parsedUrl.href === rootUrl.href) {
					rootUrlStatus = response.status();
				}
			} catch (error) {
				// invalid URL found
				console.warn(`invalid URL ${thisUrl}`);
			}
		});

		await page.goto(rootUrl);
		console.log('status for main url:', rootUrlStatus);
		await page.content();
		parser.init(page);
		const hrefs = await parser.getLinks();
		console.log(requestedUrls);
		await browser.close();

		return {
			rootUrlStatus: rootUrlStatus,
			requestedUrls: requestedUrls.length
		}
	}


};

module.exports = api;
