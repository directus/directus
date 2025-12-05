export type Files = { id: string; folder?: string }[];

const undef = Symbol('undefined');

export class NameDeduper {
	private map: Record<string | symbol, Record<string, number>> = {};

	add(name: string, group?: string | null) {
		const groupId = group ?? undef;
		const match = this.map[groupId]?.[name];

		if (match) {
			const dedupedName = `${name} (${match})`;

			this.map[groupId]![name]! += 1;

			return dedupedName;
		} else {
			if (!this.map[groupId]) {
				this.map[groupId] = {};
			}

			this.map[groupId][name] = 1;
		}

		return name;
	}
}
