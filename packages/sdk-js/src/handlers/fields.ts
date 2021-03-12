/**
 * Fields handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { FieldType } from '../types';

export type FieldItem<T extends object = {}> = FieldType & T;

export class FieldsHandler<T extends object> extends ItemsHandler<FieldItem<T>> {
	constructor(transport: ITransport) {
		super('directus_fields', transport);
	}
}
