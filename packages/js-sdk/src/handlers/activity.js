/**
 * Activity handler
 */
import { ItemsHandler } from '../base/items';
import { CommentsHandler } from './comments';
export class ActivityHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_activity', transport);
        this._comments = new CommentsHandler(this.transport);
    }
    get comments() {
        return this._comments;
    }
}
