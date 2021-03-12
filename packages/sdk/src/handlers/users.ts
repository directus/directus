/**
 * Users handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { UserType } from '../types';

export type UserItem<T extends object = {}> = UserType & T;

export class UsersHandler<T extends object> extends ItemsHandler<UserItem<T>> {
	constructor(transport: ITransport) {
		super('directus_users', transport);
	}
}
