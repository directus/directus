import { isPlainObject } from 'lodash-es';

export function splitRecursive(object: unknown): {
	rawDelta: Record<string, any>;
	defaultOverwrites: Record<string, any> | undefined;
} {
	if (isPlainObject(object) && typeof object === 'object' && object !== null) {
		const { _user, _date, ...rest } = object as any;
		const defaultOverwrites: Record<string, any> = { _user, _date };

		for (const key in rest) {
			const { rawDelta, defaultOverwrites: innerDefaultOverwrites } = splitRecursive(rest[key]);
			rest[key] = rawDelta;

			if (innerDefaultOverwrites) {
				defaultOverwrites[key] = innerDefaultOverwrites;
			} else if (Array.isArray(rest[key]) && _user !== undefined && _date !== undefined) {
				defaultOverwrites[key] = { _user, _date };
			}
		}

		return { rawDelta: rest, defaultOverwrites };
	} else if (Array.isArray(object)) {
		const rest: Record<string, any> = [];
		const defaultOverwrites: any[] = [];

		for (const key in object) {
			const { rawDelta, defaultOverwrites: innerDefaultOverwrites } = splitRecursive(object[key]);
			rest[key] = rawDelta;
			if (innerDefaultOverwrites) defaultOverwrites[key] = innerDefaultOverwrites;
		}

		return { rawDelta: rest, defaultOverwrites: defaultOverwrites.length > 0 ? defaultOverwrites : undefined };
	}

	return { rawDelta: object as any, defaultOverwrites: undefined };
}
