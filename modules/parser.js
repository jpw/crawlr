'use strict';

let _page;
const api = {
	init: puppeteerPage => {
		_page = puppeteerPage;
	},
	getCookies: async () => await _page.cookies(),
	getMatchingOriginUrls: async surfedLocation => {
		// We want A tags, with href attributes that are truthy e.g. not null
		// https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#pageevalselector-pagefunction-args
		const hrefs = await _page.evaluate(() => {
			return Array.from(document.querySelectorAll('a'), a => a.href)
				.filter(href => Boolean(href));
		});

		// The browser kindly converts relative URLs to absolute, so
		//  all we need to do to find crawl candidates is check the origins match
		//  TODO: need to toggle origin match, or domain match
		return hrefs.filter(href => {
			return typeof href.startsWith === 'function' && href.startsWith(surfedLocation.origin);
		});
	}
};

module.exports = api;
