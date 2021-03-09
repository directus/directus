/**
 * Activity handler
 */

import { ItemsHandler } from '../items';
import { ITransport } from '../../transport';
import { ActivityType } from '../../types';

export type ActivityItem<T extends object = {}> = ActivityType & T;

export class ActivityHandler<T extends object> extends ItemsHandler<ActivityItem<T>> {
	constructor(transport: ITransport) {
		super('directus_activity', transport);
	}
}
