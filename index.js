'use strict';

const puppeteer = require('puppeteer');

const initialiser = require('./modules/initialiser');
const crawler = require('./modules/crawler');
const parser = require('./modules/parser');
const reporter = require('./modules/reporter');

const inputUrl = 'https://www.nature.com/';

// these must be lower case
const unloadedResourceTypes = [
	'image',
	'media',
	'font'
];

let requestUrls = [];
let responseUrls = [];
let mainUrlStatus = 'NOT 200';

try {
	const parsedInputUrl = initialiser.parseInput(inputUrl);
} catch (error) {
	reporter.report(error)
	process.exit(9); // 9 = Invalid Argument
}



// https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-class-puppeteer
async function run() {
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
		if (url === inputUrl) {
			mainUrlStatus = status;
		}
	});

	await page.goto(inputUrl);
	console.log('status for main url:', mainUrlStatus);
	await page.content();
	const hrefs = await page.$$eval('a', links => links.map(a => a.href));
	console.log(hrefs);
	await browser.close();
	console.warn(requestUrls.length)
	console.warn(responseUrls.length)
}

run();

