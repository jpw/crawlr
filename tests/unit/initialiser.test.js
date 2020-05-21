'use strict';

const initialiser = require('../../modules/initialiser');

// https://jestjs.io/docs/en/expect#expectextendmatchers
expect.extend({
	toBeWithinRange(received, floor, ceiling) {
	  const pass = received >= floor && received <= ceiling;
	  if (pass) {
		return {
		  message: () =>
			`expected ${received} not to be within range ${floor} - ${ceiling}`,
		  pass: true,
		};
	  } else {
		return {
		  message: () =>
			`expected ${received} to be within range ${floor} - ${ceiling}`,
		  pass: false,
		};
	  }
	},
  });


describe('initialiser', () => {
	it('getMaxDepth() should return an int > 0', () => {
		const r = initialiser.getMaxDepth();
		expect(r).toBeWithinRange(1, 10000); // TODO enforce this when config dynamic
	});

	it('getInputUrls() should return a set of node URL instances', () => {
		const r = initialiser.getInputUrls();
		expect(r).toBeInstanceOf(Set); // TODO enforce this when config dynamic
		const url = r.values().next().value;
		expect(url).toBeInstanceOf(URL);
	});
});
