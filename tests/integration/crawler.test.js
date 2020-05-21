'use strict';

const crawler = require('../../modules/crawler');

describe('crawler', () => {
	it('must expose crawl()', () => {
		expect(crawler.crawl).toBeInstanceOf(Function);
	});


});
