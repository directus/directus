/**
 * Presets handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Presets<T extends object = DefaultFields> = {
	// Presets Fields
} & T;

export class PresetsHandler<T extends object> extends ItemsHandler<Presets<T>> {
	constructor(transport: ITransport) {
		super('directus_presets', transport);
	}
}
