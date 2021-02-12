# crawlr
Web crawling with node + Puppeteer.

A work in progress.

## Usage

`node app.js`

Currently the crawl configuration is hardcoded in the `initialiser`.

## Overview

The app;
1. Calls `initialiser.getInputUrls()`. The `initialiser` will eventually be replaced with a Queue Storage service.
1. Calls `crawler.crawl()` which kicks off the crawl, which eventually returns a `crawlReport`.
1. Calls `reporter.report(crawlReport)` and we are done.
