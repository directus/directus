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

	async applyTo(url: string) {
		console.log('Fetching database schema')

		const diffRequest = await fetch(`${url}/schema/diff`, {
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
			console.log('Clearing database')

			const diff = await diffRequest.json() as { data: Record<string, any> }

			await fetch(`${url}/schema/apply`, {
				method: 'POST',
				headers: {
					"Authorization": "Bearer admin",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(diff.data)
			})
		}

		console.log('Applying collections')

		for (const collection of this._collections) {
			const collectionRequest = await fetch(`${url}/collections`, {
				method: 'POST',
				headers: {
					"Authorization": "Bearer admin",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(collection)
			})

			// console.log(await collectionRequest.json())
		}

		console.log('Applying relations')

		for (const relation of this._relations) {
			const relationRequest = await fetch(`${url}/relations`, {
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
