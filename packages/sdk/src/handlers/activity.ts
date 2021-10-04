/**
 * Activity handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { ActivityType, DefaultType } from '@/src/types.js';
import { CommentsHandler } from '@/src/handlers/comments.js';

export type ActivityItem<T = DefaultType> = ActivityType & T;

export class ActivityHandler<T = DefaultType> extends ItemsHandler<ActivityItem<T>> {
	private _comments: CommentsHandler<T>;

	constructor(transport: ITransport) {
		super('directus_activity', transport);
		this._comments = new CommentsHandler(this.transport);
	}

	get comments(): CommentsHandler<T> {
		return this._comments;
	}
}
