import type { ActionHandler, FilterHandler, InitHandler } from '@directus/types';
import type { ScheduledJob } from '../utils/schedule.js';

export type EventHandler =
	| { type: 'filter'; name: string; handler: FilterHandler }
	| { type: 'action'; name: string; handler: ActionHandler }
	| { type: 'init'; name: string; handler: InitHandler }
	| { type: 'schedule'; job: ScheduledJob };
