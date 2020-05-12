'use strict';

const puppeteer = require('puppeteer');

// these must be lower case
const unloadedResourceTypes = [
	'image',
	'media',
	'font'
];

let requestUrls = [];
let responseUrls = [];
let mainUrlStatus = 'NOT 200';

const api = {
	crawl: async rootUrl => {
		// https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-class-puppeteer
		const browser = await puppeteer.launch({
			headless: true,
			slowMo: 200,
		});

		const page = await browser.newPage();
		await page.setRequestInterception(true);

		page.on('request', request => {
			requestUrls.push(request.url());
			if(unloadedResourceTypes.includes(request.resourceType().toLowerCase())){
				request.abort();
			}
			else {
				request.continue();
			}
		});

		page.on('requestfailed', request => {
			// aborting requests (above) will result in failures
		});

		page.on('response', response => {
			const request = response.request();
			const url = request.url();
			responseUrls.push(response.url());
			const status = response.status();
			if (url === rootUrl) {
				mainUrlStatus = status;
			}
		});

		await page.goto(rootUrl);
		console.log('status for main url:', mainUrlStatus);
		await page.content();
		const hrefs = await page.$$eval('a', links => links.map(a => a.href));
		console.log(hrefs);
		await browser.close();

		return {
			mainUrlStatus: mainUrlStatus,
			requestUrls: requestUrls.length,
			responseUrls: responseUrls.length
		}
	}


};

module.exports = api;
