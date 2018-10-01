'use strict';
const { getValueAsString, escapeString, escapeLabelValue } = require('./util');

const defaultMetricsOpts = {
	timestamps: true
};

class Registry {
	constructor() {
		this._metrics = {};
		this._defaultLabels = {};
	}

	getMetricsAsArray() {
		return Object.keys(this._metrics).map(this.getSingleMetric, this);
	}

	getMetricAsPrometheusString(metric, conf) {
		const opts = Object.assign({}, defaultMetricsOpts, conf);
		const item = metric.get();
		const name = escapeString(item.name);
		const help = `# HELP ${name} ${escapeString(item.help)}`;
		const type = `# TYPE ${name} ${item.type}`;
		const defaultLabelNames = Object.keys(this._defaultLabels);

		let values = '';
		if (item.values) {
			for (const val of item.values) {
				let labels = '';
				if (val.labelsAsString) {
					labels = `${val.labelsAsString},`; // TODO: fix rest of code so don't need to add comma, and remove replace() call below
				} else {
					// legacy for non histograms: TODO: support labelAsString in other types
					if (val.labels) {
						for (const key of Object.keys(val.labels)) {
							labels += `${key}="${escapeLabelValue(val.labels[key])}",`;
						}
					}
				}

				if (defaultLabelNames) {
					for (const defLbl of defaultLabelNames) {
						// Precendence given to value if in specificed labels (if any),  so only add if not already present
						if (!val.labels || !(defLbl in val.labels)) {
							labels += `${defLbl}="${escapeLabelValue(
								this._defaultLabels[defLbl]
							)}",`;
						}
					}
				}

				let metricName = val.metricName || item.name;
				if (labels) {
					metricName += `{${labels.replace(/,$/, '')}}`;
				}

				let line = `${metricName} ${getValueAsString(val.value)}`;
				if (opts.timestamps && val.timestamp) {
					line += ` ${val.timestamp}`;
				}
				values += `${line.trim()}\n`;
			}
		}

		return `${help}\n${type}\n${values}`.trim();
	}

	metrics(opts) {
		let metrics = '';

		for (const metric of this.getMetricsAsArray()) {
			metrics += `${this.getMetricAsPrometheusString(metric, opts)}\n\n`;
		}

		return metrics.replace(/\n$/, '');
	}

	registerMetric(metricFn) {
		if (
			this._metrics[metricFn.name] &&
			this._metrics[metricFn.name] !== metricFn
		) {
			throw new Error(
				`A metric with the name ${metricFn.name} has already been registered.`
			);
		}

		this._metrics[metricFn.name] = metricFn;
	}

	clear() {
		this._metrics = {};
		this._defaultLabels = {};
	}

	getMetricsAsJSON() {
		const metrics = [];
		const defaultLabelNames = Object.keys(this._defaultLabels);

		for (const metric of this.getMetricsAsArray()) {
			const item = metric.get();

			if (item.values) {
				for (const val of item.values) {
					for (const labelName of defaultLabelNames) {
						val.labels[labelName] =
							val.labels[labelName] || this._defaultLabels[labelName];
					}
				}
			}

			metrics.push(item);
		}

		return metrics;
	}

	removeSingleMetric(name) {
		delete this._metrics[name];
	}

	getSingleMetricAsString(name) {
		return this.getMetricAsPrometheusString(this._metrics[name]);
	}

	getSingleMetric(name) {
		return this._metrics[name];
	}

	setDefaultLabels(labels) {
		this._defaultLabels = labels;
	}

	resetMetrics() {
		for (const metric in this._metrics) {
			this._metrics[metric].reset();
		}
	}

	get contentType() {
		return 'text/plain; version=0.0.4; charset=utf-8';
	}

	static merge(registers) {
		const mergedRegistry = new Registry();

		const metricsToMerge = registers.reduce(
			(acc, reg) => acc.concat(reg.getMetricsAsArray()),
			[]
		);

		metricsToMerge.forEach(mergedRegistry.registerMetric, mergedRegistry);
		return mergedRegistry;
	}
}

module.exports = Registry;
module.exports.globalRegistry = new Registry();
