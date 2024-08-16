import { retention } from './retention.js';
import { telemetry } from './telemetry.js';
import { tus } from './tus.js';

export async function initSchedules() {
	retention();
	telemetry();
	tus();
}
