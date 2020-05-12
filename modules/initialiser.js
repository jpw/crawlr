'use strict';

const url = require('url');

// to be got from queue
const inputUrl = 'https://www.nature.com/';

const api = {
	getInputUrl: () => api.parseInput(inputUrl),
	parseInput: input => new URL(input)

};

module.exports = api;
