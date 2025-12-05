import sanitize from 'sanitize-filename';

export type Files = { id: string; folder?: string }[];

const DEFAULT_GROUP = Symbol('undefined');

export class NameDeduper {
	private map: Record<string | symbol, Record<string, number>> = {};

	add(name?: string | null, options?: { group?: string | null; fallback?: string }) {
		name = sanitize(name ?? '') || options?.fallback;

		if (!name) {
			throw Error('Invalid "name" provided');
		}

		const groupKey = options?.group ?? DEFAULT_GROUP;
		const match = this.map[groupKey]?.[name];

		if (match) {
			const dedupedName = `${name} (${match})`;

			this.map[groupKey]![name]! += 1;

			return dedupedName;
		} else {
			if (!this.map[groupKey]) {
				this.map[groupKey] = {};
			}

			this.map[groupKey][name] = 1;
		}

		return name;
	}
}
