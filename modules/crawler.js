'use strict';

const crypto = require('crypto');
// It's possible for node to be built without crypto, which will throw on the above
// https://nodejs.org/docs/latest-v12.x/api/crypto.html#crypto_determining_if_crypto_support_is_unavailable

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

/**
 * Iterates over doCrawl() until maxIterations reached.
 * @param {int} maxIterations - maximum number of iterations
 */
const crawlUntilMaxDepth = async maxIterations => {
	let reports = [];
	let thisIterationCount = 0;
	// uses "for await...of" to iterate over async iterable objects
	for await (const report of doCrawl()) {
		reports.push(report);
		thisIterationCount++;
		if (thisIterationCount === maxIterations) {
			_done = true;
		}
	}
	return reports;
}

/**
 * Given a cookie, this function returns a unique identifier.
 * Cookies are scoped by domain, and named, (see RFC 6265) so hopefully a hash of domain and
 * cookie name will be suitable, e.g. for a database key.
 * @param {Cookie} cookie - a Puppeteer cookie module instance
 * @returns {string} identifier - an appropriately-scoped identifier for the cookie instance
 */
const getCookieIdentifier = cookie => {
	const key = crypto.createHash('sha256').update(`${cookie.name}|${cookie.domain}`).digest('hex');
	return key.toString();
};

/**
 * doCrawl takes URLs from _urlsToCrawl, parses the page, and periodically yields a
 * page parse report, until an external flag is set or the URL set is exhausted.
 * @yields {Object} parseReport - the results from the crawled page
 */
const doCrawl = async function * () {
	try {
		const urlSetIterator = _urlsToCrawl.values();

		while (true) {
			if (_done) {
				return;
			}
			console.log(`currentSetSize: ${_urlsToCrawl.size}`);

			const currentUrl = urlSetIterator.next().value;
			if (currentUrl === undefined) { // no more URLs
				return;
			}

			console.log(`currentUrl: ${currentUrl}`);
			const {requestedUrlStatus: rootUrlStatus, hrefs, cookies} = await client.surf(currentUrl);
			hrefs.forEach(href => {
				let candidateUrl;
				try {
					candidateUrl = new URL(href);
				} catch (error) {
					// bad URL input, ignore
					return;
				}
				if (candidateUrl) {
					_urlsToCrawl.add(candidateUrl);
				}
			});

			cookies.forEach(cookie => _allCookies.set(getCookieIdentifier(cookie), cookie));
			const parseReport = {
				cookies: cookies,
				crawledUrl: currentUrl,
				crawledUrlStatus: rootUrlStatus,
				links: hrefs.length,
				currentSetSize: _urlsToCrawl.size
			};

			yield parseReport;
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
		await client.openBrowser({ // TODO move this
			headless: true,
			slowMo: 200
		});
		_urlsToCrawl = new Set(rootUrls);

		const reports = await crawlUntilMaxDepth(maxDepth);
		await client.closeBrowser();
		console.log(_allCookies);
		return reports;
	}
};

module.exports = api;
