export type ServerHealthStatus = 'ok' | 'warn' | 'error';

// Based on https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check#name-componenttype
export type ServerHealthCheck = {
	componentType: 'system' | 'datastore' | 'objectstore' | 'email' | 'cache';
	observedValue?: number | string | boolean;
	observedUnit?: string;
	status: ServerHealthStatus;
	output?: any;
	threshold?: number;
};

export type ServerHealth = {
	status: ServerHealthStatus;
	releaseId: string;
	serviceId: string;
	checks: {
		[service: string]: ServerHealthCheck[];
	};
};
