/**
 * Metric summarization and analysis for AI Context
 */

import { MetricPoint } from '../wandbParser';
import { MergedMetric } from '../MultiRunManager';
import { MetricSummary } from './types';
import { formatNumber, formatNumberForCSV } from './formatNumber';

/**
 * Summarize a metric with statistics and trend detection
 */
export function summarizeMetric(data: MetricPoint[]): MetricSummary | null {
    if (data.length === 0) {
        return null;
    }

    const values = data.map(d => d.value);
    const initial = values[0];
    const final = values[values.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Trend detection
    const trend = detectTrend(data);

    return {
        initial,
        final,
        min,
        max,
        mean,
        trend
    };
}

/**
 * Detect trend in metric data
 * Returns: ↑ (improving/increasing), ↓ (degrading/decreasing), → (stable), ~ (converged)
 */
function detectTrend(data: MetricPoint[]): '↑' | '↓' | '→' | '~' {
    if (data.length < 10) {
        return '→'; // Not enough data to determine trend
    }

    const values = data.map(d => d.value);
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const firstMean = mean(firstHalf);
    const secondMean = mean(secondHalf);
    const change = (secondMean - firstMean) / Math.abs(firstMean);

    // Check for convergence (low variance in second half)
    const secondVar = variance(secondHalf);
    if (secondVar < 0.01 * Math.abs(secondMean)) {
        return '~'; // Converged
    }

    // Determine direction
    if (Math.abs(change) < 0.05) {
        return '→'; // Stable
    } else if (change < 0) {
        return '↓'; // Decreasing
    } else {
        return '↑'; // Increasing
    }
}

/**
 * Calculate mean of an array
 */
function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate variance of an array
 */
function variance(values: number[]): number {
    if (values.length === 0) return 0;
    const m = mean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length;
}

/**
 * Format a metric summary as a markdown line
 */
export function formatMetricSummary(
    metricName: string,
    runId: string,
    runName: string,
    summary: MetricSummary | null
): string {
    if (!summary) {
        return `- **${runName}**: No data\n`;
    }

    return `- **${runName}**: initial=${formatNumber(summary.initial)}, ` +
           `final=${formatNumber(summary.final)}, ` +
           `min=${formatNumber(summary.min)}, ` +
           `max=${formatNumber(summary.max)}, ` +
           `trend=${summary.trend}\n`;
}

/**
 * Generate CSV data for a merged metric
 * Handles multiple runs with potentially misaligned steps
 */
export function generateCSV(mergedMetric: MergedMetric): string {
    if (!mergedMetric.datasets || mergedMetric.datasets.length === 0) {
        return '';
    }

    const runNames = mergedMetric.datasets.map(ds => ds.runName || ds.runId.substring(0, 8));

    // Collect all unique steps across all runs
    const allSteps = new Set<number>();
    for (const dataset of mergedMetric.datasets) {
        dataset.data.forEach(pt => allSteps.add(pt.step));
    }

    const steps = Array.from(allSteps).sort((a, b) => a - b);

    // Build CSV header
    let csv = `step,${runNames.join(',')}\n`;

    // Build CSV rows
    for (const step of steps) {
        const values = mergedMetric.datasets.map(dataset => {
            const point = dataset.data.find(pt => pt.step === step);
            return point ? formatNumberForCSV(point.value) : '';
        });
        csv += `${step},${values.join(',')}\n`;
    }

    return csv;
}

/**
 * Decimate data points if there are too many
 * Keeps first, last, and evenly distributed points in between
 */
export function decimatePoints(data: MetricPoint[], maxPoints: number = 500): MetricPoint[] {
    if (data.length <= maxPoints) {
        return data;
    }

    const result: MetricPoint[] = [];
    const step = Math.ceil(data.length / maxPoints);

    for (let i = 0; i < data.length; i += step) {
        result.push(data[i]);
    }

    // Always include the last point
    if (result[result.length - 1] !== data[data.length - 1]) {
        result.push(data[data.length - 1]);
    }

    return result;
}

/**
 * Group metrics by prefix for organized display
 */
export function groupMetricsByPrefix(metricNames: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    for (const name of metricNames) {
        const group = extractGroupName(name);
        if (!groups.has(group)) {
            groups.set(group, []);
        }
        groups.get(group)!.push(name);
    }

    return groups;
}

/**
 * Extract group name from metric name
 * Examples: "loss/train" -> "loss", "train_loss" -> "train", "gpu.0.memory" -> "gpu.0"
 */
function extractGroupName(metricName: string): string {
    // Check for slash separator
    if (metricName.includes('/')) {
        return metricName.split('/')[0];
    }
    // Check for underscore separator
    if (metricName.includes('_')) {
        return metricName.split('_')[0];
    }
    // Check for dot separator (but keep first two parts for things like "gpu.0")
    if (metricName.includes('.')) {
        const parts = metricName.split('.');
        return parts.slice(0, Math.min(2, parts.length)).join('.');
    }
    // No separator found, use full name
    return metricName;
}
