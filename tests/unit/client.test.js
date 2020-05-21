'use strict';

const client = require('../../modules/client');

describe('client', () => {
	it('must expose openBrowser()', () => {
		expect(client.openBrowser).toBeInstanceOf(Function);
	});

	it('must expose closeBrowser()', () => {
		expect(client.closeBrowser).toBeInstanceOf(Function);
	});
});
