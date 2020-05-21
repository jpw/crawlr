'use strict';

const crypto = require('crypto');
// It's possible for node to be built without crypto, which may throw on the above
// https://nodejs.org/docs/latest-v12.x/api/crypto.html#crypto_determining_if_crypto_support_is_unavailable

/**
 * Module that opens a browser, loads the initial ("root") URLs provided by the user,
 * maintains URL & Cookie state, and returns when maxdepth is reached. Too much? :)
 * @module crawler
 */

const client = require('./client');
const reporter = require('./reporter');

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
 * Given a Set rootUrls, loads them, parses the page, and periodically yields a
 * page parse report, until maxIterations completed or the URL set is exhausted.
 * @param {Set<URL>} rootUrls - a Set of node URL module instances to start crawling from
 * @param {int} maxIterations - maximum number of URL instances to load & parse
 * @yields {Object} parseReport - the results from the crawled page
 */
const crawlUrlsUntilMaxDepth = async function * (rootUrls, maxIterations) {
	try {
		let urlsToCrawl = rootUrls;
		const urlSetIterator = urlsToCrawl.values();
		let iterations = 0;

		while (iterations < maxIterations) {
			console.log(`currentSetSize: ${urlsToCrawl.size}`);

			const currentUrl = urlSetIterator.next().value;
			if (currentUrl === undefined) { // no more URLs, so finish crawling
				return;
			}

			console.log(`currentUrl: ${currentUrl}`);
			const {requestedUrlStatus: rootUrlStatus, hrefs, cookies} = await client.surf(currentUrl);
			for (const href of hrefs) {
				let candidateUrl;
				try {
					candidateUrl = new URL(href);
				} catch {
					// bad URL input, ignore
					return;
				}
				if (candidateUrl) {
					urlsToCrawl.add(candidateUrl);
				}
			}

			const parseReport = {
				cookies: cookies,
				crawledUrl: currentUrl,
				crawledUrlStatus: rootUrlStatus,
				links: hrefs.length,
				currentSetSize: urlsToCrawl.size
			};

			iterations++;
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
		await client.openBrowser({ // TODO move this?
			headless: true,
			slowMo: 200
		});

		let reports = [];
		// uses "for await...of" to iterate over async iterable objects
		for await (const report of crawlUrlsUntilMaxDepth(rootUrls, maxDepth)) {
			reports.push(report);
		}

		// try and free some resources ASAP
		await client.closeBrowser();

		// generate the cookie report
		let allCookies = new Map();
		reports.forEach(report => {
			report.cookies.forEach(cookie => allCookies.set(getCookieIdentifier(cookie), cookie));
		});
		console.log(allCookies);

		return reports;
	}
};

module.exports = api;
