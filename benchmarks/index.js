'use strict';

const argv = require('minimist')(process.argv.slice(2));

const createRegressionBenchmark = require('@clevernature/benchmark-regression');

const currentClient = require('..');
const benchmarks = createRegressionBenchmark(currentClient, [
	'prom-client@latest'
]);

const defaultSuite = [
	'registryHistogram',
	'histogram',
	'registryGauge',
	'gauge',
	'registryCounter',
	'counter'
];

const suiteArray = argv._.length === 0 ? defaultSuite : argv._;

suiteArray.forEach(name => {
	benchmarks.suite(name, require(`./${name}`));
});

benchmarks.run().catch(err => {
	console.error(err.stack);
	// eslint-disable-next-line no-process-exit
	process.exit(1);
});
