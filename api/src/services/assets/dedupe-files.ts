export type Files = { id: string; folder?: string }[];

const undef = Symbol('undefined');

export class FileDeduper {
	private map: Record<string | symbol, [string, number][]> = {};

	add(name: string, folder?: string) {
		let match;
		const folderId = folder ?? undef;

		if (folderId in this.map && Array.isArray(this.map[folderId])) {
			match = this.map[folderId]?.find(([n, _]) => n === name);

			if (match) {
				name += ` (${match[1]})`;
				match[1]++;

				return name;
			}
		}

		if (!match) {
			this.map[folderId] = [...(this.map[folderId] ?? []), [name, 1]];
		}

		return name;
	}
}
