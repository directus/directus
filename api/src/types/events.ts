import { ScheduledTask } from 'node-cron';
import { ActionHandler, FilterHandler, InitHandler } from './extensions';

export type EventHandler =
	| { type: 'filter'; name: string; handler: FilterHandler }
	| { type: 'action'; name: string; handler: ActionHandler }
	| { type: 'init'; name: string; handler: InitHandler }
	| { type: 'schedule'; task: ScheduledTask };
