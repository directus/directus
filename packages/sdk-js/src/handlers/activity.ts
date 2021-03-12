/**
 * Activity handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { ActivityType } from '../types';
import { CommentsHandler } from './comments';

export type ActivityItem<T extends object = {}> = ActivityType & T;

export class ActivityHandler<T extends object> extends ItemsHandler<ActivityItem<T>> {
	private _comments: CommentsHandler<T>;

	constructor(transport: ITransport) {
		super('directus_activity', transport);
		this._comments = new CommentsHandler(this.transport);
	}

	get comments() {
		return this._comments;
	}
}
