import type { Metric } from 'web-vitals';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { getMeter } from '../telemetry';

/**
 * Initialize Web Vitals collection and report metrics to OpenTelemetry
 *
 * Collects Core Web Vitals:
 * - LCP (Largest Contentful Paint): Loading performance - measures when the main content loads
 * - INP (Interaction to Next Paint): Interactivity - measures responsiveness to user input
 * - CLS (Cumulative Layout Shift): Visual stability - measures unexpected layout shifts
 * - FCP (First Contentful Paint): Initial paint time
 * - TTFB (Time to First Byte): Server response time
 */
export function initWebVitals() {
	const meter = getMeter('directus-app-web-vitals');

	if (!meter) {
		console.warn('OpenTelemetry meter not available, Web Vitals will not be collected');
		return;
	}

	// Create histograms for each Web Vital metric
	const lcpHistogram = meter.createHistogram('web_vitals_lcp', {
		description: 'Largest Contentful Paint (LCP) - loading performance',
		unit: 'ms',
	});

	const inpHistogram = meter.createHistogram('web_vitals_inp', {
		description: 'Interaction to Next Paint (INP) - interactivity',
		unit: 'ms',
	});

	const clsHistogram = meter.createHistogram('web_vitals_cls', {
		description: 'Cumulative Layout Shift (CLS) - visual stability',
		unit: 'score',
	});

	const fcpHistogram = meter.createHistogram('web_vitals_fcp', {
		description: 'First Contentful Paint (FCP) - initial paint time',
		unit: 'ms',
	});

	const ttfbHistogram = meter.createHistogram('web_vitals_ttfb', {
		description: 'Time to First Byte (TTFB) - server response time',
		unit: 'ms',
	});

	// Helper function to report metrics
	const reportMetric = (metric: Metric, histogram: ReturnType<typeof meter.createHistogram>) => {
		const attributes = {
			'web_vitals.name': metric.name,
			'web_vitals.rating': metric.rating, // 'good' | 'needs-improvement' | 'poor'
			'web_vitals.id': metric.id,
			'web_vitals.navigation_type': metric.navigationType,
			'page.url': window.location.href,
			'page.path': window.location.pathname,
		};

		histogram.record(metric.value, attributes);

		// Also log significant metrics
		if (metric.rating === 'poor') {
			console.warn(`[Web Vitals] Poor ${metric.name}: ${metric.value}`, {
				rating: metric.rating,
				threshold: getThreshold(metric.name),
			});
		}
	};

	// Register Web Vitals observers
	onLCP((metric) => reportMetric(metric, lcpHistogram));
	onINP((metric) => reportMetric(metric, inpHistogram));
	onCLS((metric) => reportMetric(metric, clsHistogram));
	onFCP((metric) => reportMetric(metric, fcpHistogram));
	onTTFB((metric) => reportMetric(metric, ttfbHistogram));

	console.log('[Web Vitals] Monitoring initialized');
}

/**
 * Get the "good" threshold for a Web Vital metric
 */
function getThreshold(metric: string): string {
	const thresholds: Record<string, string> = {
		LCP: '2.5s',
		INP: '200ms',
		CLS: '0.1',
		FCP: '1.8s',
		TTFB: '800ms',
	};

	return thresholds[metric] || 'unknown';
}
