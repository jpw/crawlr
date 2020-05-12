'use strict';

let page;
const api = {
	init: puppeteerPage => {
		page = puppeteerPage;
	},
	getLinkUrls: async rootUrl => {
		const hrefs = await page.$$eval('a', links => links.map(a => a.href));
		// we want abs links on the same origin, and relative links
		return hrefs;
	}
};

module.exports = api;
