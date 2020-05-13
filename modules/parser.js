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
			return Array.from(document.getElementsByTagName('a'), a => a.href)
				.filter(href => Boolean(href))
		});

		// The browser kindly converts relative URLs to absolute, so
		//  all we need to do to find crawl candidates is check the origins match
		return hrefs.filter(href => href.startsWith(surfedLocation.origin));
	}
};

module.exports = api;
