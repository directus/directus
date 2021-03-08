/**
 * Activity handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';
import { ID } from '../../items';

export type Activity<T extends object = DefaultFields> = {
	action: string;
	ip: string;
	item: ID;
	user_agent: string;
	timestamp: string;
	id: number;
	user: string;
	comment: string | null;
	collection: string;
	revisions: [number] | null;
} & T;

export class ActivityHandler<T extends object> extends ItemsHandler<Activity<T>> {
	constructor(transport: ITransport) {
		super('directus_activity', transport);
	}
}
