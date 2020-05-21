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
	it('should call console.log', () => {
		reporter.report('a test message');
		expect(console.log).toBeCalled();

	});
});
