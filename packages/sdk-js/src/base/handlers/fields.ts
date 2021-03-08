/**
 * Fields handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Fields<T extends object = DefaultFields> = {
	// Fields Fields
} & T;

export class FieldsHandler<T extends object> extends ItemsHandler<Fields<T>> {
	constructor(transport: ITransport) {
		super('directus_fields', transport);
	}
}
