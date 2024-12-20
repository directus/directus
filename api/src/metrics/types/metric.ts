export interface ServiceMetric {
	name: string;
	value: number | null;
	type: 'counter' | 'gauge' | 'histogram';
	help?: string;
}
