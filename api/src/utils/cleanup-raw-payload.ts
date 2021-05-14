import { Item } from '../types';

export function cleanupRawPayload<T extends Partial<Item> | Partial<Item>[]>(payloads: T): T {
	for (const payload of Array.isArray(payloads) ? payloads : [payloads]) {
		for (const key in payload) {
			if (payload[key]?.isRawInstance) {
				payload[key] = payload[key].bindings[0];
			}
		}
	}
	return payloads;
}
