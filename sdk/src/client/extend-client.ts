import type { DirectusClient } from './types.js';

export const extendClient = <Schema extends object, Features extends object, ExtraFeatures extends object>(
	client: DirectusClient<Schema, Features>,
	properties: ExtraFeatures
): DirectusClient<Schema, Features & ExtraFeatures> => {
	const partialClient = client as Partial<Features & ExtraFeatures>;
	const getKeys = <T extends object>(obj: T) => Object.keys(obj) as (keyof T)[];

	getKeys(properties).forEach((key) => {
		if (key === 'config') {
			partialClient[key] = {
				...partialClient[key],
				...properties[key],
			} as (Features & ExtraFeatures)[keyof ExtraFeatures];
		} else {
			partialClient[key] = properties[key] as (Features & ExtraFeatures)[keyof ExtraFeatures];
		}
	});

	return partialClient as DirectusClient<Schema, Features & ExtraFeatures>;
};
