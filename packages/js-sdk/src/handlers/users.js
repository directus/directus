/**
 * Users handler
 */
import { ItemsHandler } from '../base/items';
import { InvitesHandler } from './invites';
import { MeHandler } from './me';
export class UsersHandler extends ItemsHandler {
    constructor(transport) {
        super('directus_users', transport);
    }
    get invites() {
        return this._invites || (this._invites = new InvitesHandler(this.transport));
    }
    get me() {
        return this._me || (this._me = new MeHandler(this.transport));
    }
}
