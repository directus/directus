import type { Table } from "@directus/schema";
import type { BaseCollectionMeta } from "@directus/system-data";
import type { RawField, Relation } from "@directus/types";

export type RawCollection = {
	collection: string;
	fields?: RawField[];
	schema?: Partial<Table> | null;
	meta?: Partial<BaseCollectionMeta> | null;
};

export class SAI {
	_collections: RawCollection[]
	_relations: Relation[]

	constructor(collections: RawCollection[], relations: Relation[]) {
		this._collections = collections
		this._relations = relations
	}

	async applyTo() {
		const diffRequest = await fetch('http://localhost:8055/schema/diff', {
			method: 'POST',
			headers: {
				"Authorization": "Bearer admin",
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				"version": "1",
				"directus": "11.7.2",
				"vendor": "postgres",
				"collections": [],
				"fields": [],
				"relations": []
			})
		})

		if (diffRequest.status !== 204) {
			const diff = await diffRequest.json() as { data: Record<string, any> }

			await fetch('http://localhost:8055/schema/apply', {
				method: 'POST',
				headers: {
					"Authorization": "Bearer admin",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(diff.data)
			})
		}

		for (const collection of this._collections) {
			const collectionRequest = await fetch('http://localhost:8055/collections', {
				method: 'POST',
				headers: {
					"Authorization": "Bearer admin",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(collection)
			})

			// console.log(await collectionRequest.json())
		}

		for (const relation of this._relations) {
			const relationRequest = await fetch('http://localhost:8055/relations', {
				method: 'POST',
				headers: {
					"Authorization": "Bearer admin",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(relation)
			})

			// console.log(await relationRequest.json())

		}


	}
}
