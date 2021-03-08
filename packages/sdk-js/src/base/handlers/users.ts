/**
 * Users handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Users<T extends object = DefaultFields> = {
	// Users Fields
} & T;

export class UsersHandler<T extends object> extends ItemsHandler<Users<T>> {
	constructor(transport: ITransport) {
		super('directus_users', transport);
	}
}
