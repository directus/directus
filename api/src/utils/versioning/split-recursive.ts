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
			if (innerDefaultOverwrites) defaultOverwrites[key] = innerDefaultOverwrites;
		}

		return { rawDelta: rest, defaultOverwrites };
	} else if (Array.isArray(object)) {
		const rest: Record<string, any> = [];
		const defaultOverwrites: Record<string, any> = [];

		for (const key in object) {
			const { rawDelta, defaultOverwrites: innerDefaultOverwrites } = splitRecursive(object[key]);
			rest[key] = rawDelta;
			if (innerDefaultOverwrites) defaultOverwrites[key] = innerDefaultOverwrites;
		}

		object.map((value) => splitRecursive(value));

		return { rawDelta: rest, defaultOverwrites };
	}

	return { rawDelta: object as any, defaultOverwrites: undefined };
}
