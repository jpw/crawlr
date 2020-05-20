'use strict';
// https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-class-puppeteer
const puppeteer = require('puppeteer');

const parser = require('./parser');

const interceptClientInitiatedRedirects = true;
// these must be lower case
const _resourceTypesToNotLoad = new Set([
	'image',
	'media',
	'font'
]);

let _browser;
let _responseStatus;

const statusCodeIsRedirect = status => status >= 300 && status <= 399;

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
			// setRequestInterception enables request.abort, request.continue & request.respond methods
			await page.setRequestInterception(true);
		} catch (error) {
			console.error(error);
			return; // as any error here is going to be fatal
		}

		// event fires when browser requests another resource
		page.on('request', request => {
			const lcResourceType = request.resourceType().toLowerCase();
			if (_resourceTypesToNotLoad.has(lcResourceType)) {
				request.abort();
				return;
			}

			// If we do not intercept "client-initiated" redirects (e.g. history API manipulation,
			//  location.href assignment in JS, META redirect tags) the browser will navigate
			//  away while we are trying to examine the DOM and errors get thrown, typically
			//  "Error: Execution context was destroyed, most likely because of a navigation."
			if (interceptClientInitiatedRedirects) {
				const parsedRequestUrl = new URL(request.url());
				if (request.isNavigationRequest() &&
					!statusCodeIsRedirect(_responseStatus) &&
					request.frame() === page.mainFrame() &&
					parsedRequestUrl.href !== location.href) {
					console.warn(`*** status: ${_responseStatus} abort load of ${parsedRequestUrl.href} from ${location.href}`);
					// request.abort('aborted');
					request.continue(); // continue while we debug. i want to see a crash.
					return;
				}
			}
			request.continue();
		});

		// event fires when browser fails to load another resource
		page.on('requestfailed', request => {
			// aborting requests (above) will result in failures
		});

		// event fires when browser gets a request response
		page.on('response', response => {
			_responseStatus = response.status();
			// following trying to give nicer reports on requested URLs
			// maybe should lose it all
			const thisUrl = response.url();
			let parsedUrl;
			try {
				parsedUrl = new URL(thisUrl);
				const status = response.status();
				if (parsedUrl.href === location.href &&
					(status < 300 || status >= 400)
				) {
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
		};
	}
};

module.exports = api;
