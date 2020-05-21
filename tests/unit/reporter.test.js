'use strict';

const reporter = require('../../modules/reporter');

let oldLog;
beforeAll(() => {
	oldLog = console.log;
	console.log = jest.fn();
});

afterAll(() => {
	console.log = oldLog;
});

describe('reporter', () => {
	it('should call console.log with the supplied message', () => {
		const message = 'a test message';
		reporter.report(message);
		expect(console.log).toBeCalledWith(message);
	});
});
