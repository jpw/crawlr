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
let rootUrlStatus;
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
			const status = response.status();
			if (parsedUrl.href === rootUrl.href
					&& (status < 300 || status >= 400)
				)
			{
				requestedUrls.push(parsedUrl);
				rootUrlStatus = status;
			}
		} catch (error) {
			// invalid URL found
			console.warn(`invalid URL ${thisUrl}`);
		}
	});

	await page.goto(rootUrl);
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
		const crawlResult = await doCrawl();
		return crawlResult;
	}
};

module.exports = api;
