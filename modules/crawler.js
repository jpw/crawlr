'use strict';

const url = require('url');

const client = require('./client');
const reporter = require('./reporter');

let urlsToCrawl = new Set();

const doCrawl = async () => {

	const currentUrl = urlsToCrawl.values().next().value;
	const {requestedUrlStatus: rootUrlStatus, hrefs} = await client.surf(currentUrl);

	console.log(hrefs)
	console.log(hrefs.length);

	return {
		rootUrlStatus: rootUrlStatus,
	}
};

const api = {
	crawl: async rootUrl => {
		urlsToCrawl.add(rootUrl);
		const crawlResult = await doCrawl();
		return crawlResult;
	}
};

module.exports = api;
