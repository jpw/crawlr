'use strict';

let page;
const api = {
	init: puppeteerPage => {
		page = puppeteerPage;
	},
	getLinks: async () => {
		const hrefs = await page.$$eval('a', links => links.map(a => a.href));
		return hrefs;
	}
};

module.exports = api;
