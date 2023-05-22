/**
 * Users handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { DefaultType, UserType } from '../types';
import { InvitesHandler } from './invites';
import { MeHandler } from './me';

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
