'use strict';

/**
 * Module that opens a browser, loads the initial ("root") URLs provided by the user,
 * maintains URL & Cookie state, and returns when maxdepth is reached. Too much? :)
 * @module crawler
 */

const client = require('./client');
const reporter = require('./reporter');

let _urlsToCrawl = new Set();
let _allCookies = new Map();
let _done = false;

// a generator function that periodically yields a page parse report
const doCrawl = async function * () {
	try {
		const urlSetIterator = _urlsToCrawl.values();

		while (true) {
			console.log(`currentSetSize: ${_urlsToCrawl.size}`);

			const currentUrl = urlSetIterator.next().value;
			console.log(`currentUrl: ${currentUrl}`);
			const {requestedUrlStatus: rootUrlStatus, hrefs, cookies} = await client.surf(currentUrl);
			hrefs.forEach(href => _urlsToCrawl.add(new URL(href)));
			cookies.forEach(cookie => _allCookies.set(cookie.name, cookie.domain));

			const progress = {
				cookies: cookies,
				crawledUrl: currentUrl,
				crawledUrlStatus: rootUrlStatus,
				links: hrefs.length,
				currentSetSize: _urlsToCrawl.size
			};

			if (_done) {
				return;
			}

			yield progress;
		}
	} catch (error) {
		console.error(error);
	}
};

const api = {
	/**
	 * Opens a web browser and commences crawling.
	 * @param {Array<URL>} rootUrls - node URL module instances
	 * @param {int} maxDepth - maximum number of URLs to crawl
	 * @returns {Promise<Array>} reports - an array of reports, one per page
	 */
	crawl: async (rootUrls, maxDepth) => {
		let reports = [];
		await client.openBrowser({ // TODO move this
			headless: true,
			slowMo: 200
		});
		_urlsToCrawl = new Set(rootUrls);

		// keep crawling until maxDepth is reached
		async function crawlLoop() {
			let count = 0;
			// uses "for await...of" to iterate over async iterable objects
			for await (const report of doCrawl()) {
				reports.push(report);
				count++;
				if (count === maxDepth) {
					_done = true;
				}
			}
		}

		await crawlLoop(rootUrls);
		await client.closeBrowser();
		console.log(_allCookies);
		return reports;
	}
};

module.exports = api;
