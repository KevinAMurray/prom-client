'use strict';

const { getLabelNames, getLabelCombinations } = require('./utils/labels');
const { labelSetups } = require('./labelSetups');

module.exports = setupRegistrySuite;

function setupRegistrySuite(suite) {
	labelSetups.forEach(({ name, counts }) => {
		suite.add(
			`getMetricsAsJSON#${name}`,
			(client, registry) => registry.getMetricsAsJSON(),
			{ setup: setup(counts) }
		);
	});

	labelSetups.forEach(({ name, counts }) => {
		suite.add(`metrics#${name}`, (client, registry) => registry.metrics(), {
			setup: setup(counts)
		});
	});
}

function setup(labelCounts) {
	return client => {
		const registry = new client.Registry();

		const counter = new client.Counter({
			name: 'counter',
			help: 'counter',
			labelNames: getLabelNames(labelCounts.length),
			registers: [registry]
		});

		const labelCombinations = getLabelCombinations(labelCounts);

		labelCombinations.forEach(labels => counter.inc(labels, 1));

		return registry;
	};
}
