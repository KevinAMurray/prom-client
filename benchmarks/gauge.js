'use strict';

const { getLabelNames, labelCombinationFactory } = require('./utils/labels');
const { labelSetups } = require('./labelSetups');

module.exports = setupGaugeSuite;

function setupGaugeSuite(suite) {
	labelSetups.forEach(({ name, counts }) => {
		suite.add(
			`gaugeSet#${name}`,
			labelCombinationFactory(counts, (client, { gauge }, labels) =>
				gauge.set(labels, 1)
			),
			{ teardown, setup: setup(counts.length) }
		);
	});
}

function setup(labelCount) {
	return client => {
		const registry = new client.Registry();

		const gauge = new client.Gauge({
			name: 'gauge',
			help: 'gauge',
			labelNames: getLabelNames(labelCount),
			registers: [registry]
		});

		return { registry, gauge };
	};
}

function teardown(client, { registry }) {
	registry.clear();
}
