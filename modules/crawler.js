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
let urlsToCrawl = new Set();

const doCrawl = async () => {

	const rootUrl = urlsToCrawl.values().next().value;
	// https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-class-puppeteer
	const browser = await puppeteer.launch({
		headless: true,
		slowMo: 200,
	});

	const page = await browser.newPage();
	await page.setRequestInterception(true);

	// event fires when browser requests another resource
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

	// event fires when browser gets a request response
	page.on('response', response => {
		const thisUrl = response.url();
		let parsedUrl;
		try {
			parsedUrl = new URL(thisUrl);
			if (parsedUrl.href === rootUrl.href) {
				requestedUrls.push(parsedUrl);
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
	const hrefs = await parser.getLinkUrls(rootUrl);
	console.log(hrefs)
	console.log(hrefs.length);

	await browser.close();

	return {
		rootUrlStatus: rootUrlStatus,
		requestedUrls: requestedUrls.length
	}
};

const api = {
	crawl: async rootUrl => {
		urlsToCrawl.add(rootUrl);
		const crawResult = await doCrawl();
		return crawResult;
	}
};

module.exports = api;
