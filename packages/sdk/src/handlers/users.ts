/**
 * Users handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { DefaultType, UserType } from '@/src/types.js';
import { InvitesHandler } from '@/src/handlers/invites.js';
import { MeHandler } from '@/src/handlers/me.js';

export type UserItem<T = DefaultType> = UserType & T;

export class UsersHandler<T = DefaultType> extends ItemsHandler<UserItem<T>> {
	private _invites?: InvitesHandler;
	private _me?: MeHandler<UserItem<T>>;

	constructor(transport: ITransport) {
		super('directus_users', transport);
	}

	get invites(): InvitesHandler {
		return this._invites || (this._invites = new InvitesHandler(this.transport));
	}

	get me(): MeHandler<UserItem<T>> {
		return this._me || (this._me = new MeHandler(this.transport));
	}
}
