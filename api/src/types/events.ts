import { ActionHandler, FilterHandler, InitHandler } from '@directus/shared/types';
import { ScheduledTask } from 'node-cron';

export type EventHandler =
	| { type: 'filter'; id: string; events: string[]; handler: FilterHandler }
	| { type: 'action'; id: string; events: string[]; handler: ActionHandler }
	| { type: 'init'; id: string; events: string[]; handler: InitHandler }
	| { type: 'schedule'; task: ScheduledTask };
