'use strict';

const initialiser = require('./modules/initialiser');
const crawler = require('./modules/crawler');
const reporter = require('./modules/reporter');

const main = async () => {
	let parsedInputUrls;
	try {
		parsedInputUrls = initialiser.getInputUrls();
	} catch (error) {
		reporter.report(error);
		process.exit(9); // 9 = Invalid Argument
	}

	try {
		const crawlReport = await crawler.crawl(parsedInputUrls, initialiser.getMaxDepth());
		console.log(`crawl complete!`);
		//reporter.report(crawlReport);
	} catch (error) {
		reporter.report(error);
	}
};

main();
