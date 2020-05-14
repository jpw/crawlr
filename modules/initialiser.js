'use strict';

const url = require('url');

// to be got from queue
const inputUrl = 'https://www.nature.com/';
//const inputUrl = 'https://www.w3.org/TR/WD-html40-970917/htmlweb.html';
//const inputUrl = 'https://www.amazon.com/';
//const inputUrl = 'https://www.yahoo.com/';

const api = {
	getInputUrl: () => api.parseInput(inputUrl),
	parseInput: input => new URL(input)

};

module.exports = api;
