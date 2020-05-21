'use strict';

// to be got from queue
// const inputUrls = 'https://www.nature.com/';
// const inputUrls = 'https://www.w3.org/TR/WD-html40-970917/htmlweb.html';
const inputUrls = 'https://www.amazon.com/';
// const inputUrls = 'https://www.yahoo.com/';

const parseInput = input => {
	if (typeof input === 'string') {
		input = [input];
	}

	let urls = new Set();
	input.forEach(element => {
		let thisUrl;
		try {
			thisUrl = new URL(element);
		} catch (error) {
			console.warn('rejected invalid input URL');
			console.error(error);
		}
		// TODO: check origin/domain match?
		urls.add(thisUrl);
	});

	return urls;
};

const api = {
	getMaxDepth: () => 2,
	getInputUrls: () => parseInput(inputUrls)
};

module.exports = api;
