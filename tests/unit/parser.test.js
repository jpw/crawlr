'use strict';

const parser = require('../../modules/parser');

describe('parser', () => {
	it('must expose init()', () => {
		expect(parser.init).toBeInstanceOf(Function);
	});

	it('must expose getCookies()', () => {
		expect(parser.getCookies).toBeInstanceOf(Function);
	});
});
