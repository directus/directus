/**
 * Fields handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { FieldType, DefaultType } from '../types';

export type FieldItem<T = DefaultType> = FieldType & T;

export class FieldsHandler<T = DefaultType> extends ItemsHandler<FieldItem<T>> {
	constructor(transport: ITransport) {
		super('directus_fields', transport);
	}
}
