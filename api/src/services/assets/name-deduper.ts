export type Files = { id: string; folder?: string }[];

const undef = Symbol('undefined');

export class NameDeduper {
	private map: Record<string | symbol, [string, number][]> = {};

	add(name: string, group?: string | null) {
		let match;
		const groupId = group ?? undef;

		if (groupId in this.map && Array.isArray(this.map[groupId])) {
			match = this.map[groupId]?.find(([n, _]) => n === name);

			if (match) {
				name += ` (${match[1]})`;
				match[1]++;

				return name;
			}
		}

		if (!match) {
			this.map[groupId] = [...(this.map[groupId] ?? []), [name, 1]];
		}

		return name;
	}
}
