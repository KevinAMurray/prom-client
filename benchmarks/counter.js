'use strict';

const { getLabelNames, labelCombinationFactory } = require('./utils/labels');
const { labelSetups } = require('./labelSetups');

module.exports = setupCounterSuite;

function setupCounterSuite(suite) {
	labelSetups.forEach(({ name, counts }) => {
		suite.add(
			`counterInc#${name}`,
			labelCombinationFactory(counts, (client, { counter }, labels) =>
				counter.inc(labels, 1)
			),
			{ teardown, setup: setup(counts.length) }
		);
	});
}

function setup(labelCount) {
	return client => {
		const registry = new client.Registry();

		const counter = new client.Counter({
			name: 'counter',
			help: 'counter',
			labelNames: getLabelNames(labelCount),
			registers: [registry]
		});

		return { registry, counter };
	};
}

function teardown(client, { registry }) {
	registry.clear();
}
