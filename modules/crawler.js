'use strict';

const url = require('url');

const client = require('./client');
const reporter = require('./reporter');

let _urlsToCrawl = new Set();
let _done = false;

// a generator function that periodically yields a page parse report
const doCrawl = async function* () {
	try {
		const urlSetIterator = _urlsToCrawl.values();

		while (true) {
			console.log(`currentSetSize: ${_urlsToCrawl.size}`)

			const currentUrl = urlSetIterator.next().value;
			console.log(`currentUrl: ${currentUrl}`)
			const {requestedUrlStatus: rootUrlStatus, hrefs, cookies} = await client.surf(currentUrl);
			console.log(`adding ${hrefs.length} lnks`)
			hrefs.forEach(href => _urlsToCrawl.add(new URL(href)));

			const progress = {
				cookies: cookies,
				crawledUrl: currentUrl,
				crawledUrlStatus: rootUrlStatus,
				//linksFound: hrefs,
				links: hrefs.length,
				currentSetSize: _urlsToCrawl.size,
				//currentSet: urlsToCrawl
			};
			//reporter.report(progress);

			if (_done) {
				return;
			}

			yield progress;
		}
	} catch (error) {
		console.error(error)
	} finally {
		// ?
	}
};

const api = {
	crawl: async ({rootUrl, maxDepth}) => {
		let reports = [];
		await client.openBrowser({
			headless: true,
			slowMo: 200,
		});
		_urlsToCrawl.add(rootUrl);

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
		};

		await crawlLoop(rootUrl);
		await client.closeBrowser();
		console.log(`crawler.crawl returning for ${rootUrl}`)
		return reports;
	}
};

module.exports = api;
