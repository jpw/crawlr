'use strict';

// TODO handle this case:
//currentUrl: https://www.amazon.com/gcx/-/gfhz/connections/list?ref_=nav_ListFlyout_fafgift
//Error: Execution context was destroyed, most likely because of a navigation.
// yep, its a (JS?) redir to a login page

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
		//  TODO: need to toggle origin match, or domain match
		return hrefs.filter(href => {
			return typeof href.startsWith === 'function' && href.startsWith(surfedLocation.origin)
		});
	}
};

module.exports = api;
