import { Comment, ID } from '../types';
import { ITransport } from '../transport';
import { ActivityItem } from './activity';
import { EmptyParamError } from '../items';

export class CommentsHandler<T> {
	private transport: ITransport;

	constructor(transport: ITransport) {
		this.transport = transport;
	}

	async create(comment: Comment): Promise<ActivityItem<T>> {
		const response = await this.transport.post('/activity/comment', comment);
		return response.data;
	}

	async update(comment_activity_id: ID, comment: string): Promise<ActivityItem<T>> {
		if (`${comment_activity_id}` === '') throw new EmptyParamError('comment_activity_id');

		const response = await this.transport.patch(`/activity/comment/${encodeURI(comment_activity_id as string)}`, {
			comment,
		});

		return response.data;
	}

	async delete(comment_activity_id: ID): Promise<void> {
		if (`${comment_activity_id}` === '') throw new EmptyParamError('comment_activity_id');
		await this.transport.delete(`/activity/comment/${encodeURI(comment_activity_id as string)}`);
	}
}
