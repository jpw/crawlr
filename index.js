'use strict';

const initialiser = require('./modules/initialiser');
const crawler = require('./modules/crawler');
const reporter = require('./modules/reporter');

const main = async () => {
	let parsedInputUrl;
	try {
		parsedInputUrl = initialiser.getInputUrl();
	} catch (error) {
		reporter.report(error)
		process.exit(9); // 9 = Invalid Argument
	}

	try {
		const crawlReport = await crawler.crawl({
			rootUrl: parsedInputUrl,
			maxDepth: 3
		});
		//reporter.report(crawlReport);
	} catch (error) {
		reporter.report(error);
	}
};

main();
