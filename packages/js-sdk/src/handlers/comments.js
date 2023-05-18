import { EmptyParamError } from '../items';
export class CommentsHandler {
    constructor(transport) {
        this.transport = transport;
    }
    async create(comment) {
        const response = await this.transport.post('/activity/comment', comment);
        return response.data;
    }
    async update(comment_activity_id, comment) {
        if (`${comment_activity_id}` === '')
            throw new EmptyParamError('comment_activity_id');
        const response = await this.transport.patch(`/activity/comment/${encodeURI(comment_activity_id)}`, {
            comment,
        });
        return response.data;
    }
    async delete(comment_activity_id) {
        if (`${comment_activity_id}` === '')
            throw new EmptyParamError('comment_activity_id');
        await this.transport.delete(`/activity/comment/${encodeURI(comment_activity_id)}`);
    }
}
