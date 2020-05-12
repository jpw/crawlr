'use strict';

const url = require('url');

// to be got from queue
//const inputUrl = 'https://www.nature.com/';
const inputUrl = 'https://stackoverflow.com/questions/49492017/how-to-get-all-links-from-the-dom';

const api = {
	getInputUrl: () => api.parseInput(inputUrl),
	parseInput: input => new URL(input)

};

module.exports = api;
