import { expectTypeOf, test } from "vitest";
import type { Query } from "./query.js";
// import type { QueryFieldsRelational } from "./fields.js";

type CollectionA = {
	id: string;
}

type Schema = {
	collection_a: CollectionA[];
}

test('Test Query Fields', () => {
	// check fallback without schema
	type TestQuery1 = Query<any, CollectionA>;

	expectTypeOf<TestQuery1['fields']>()
		.exclude<undefined>()
		.toEqualTypeOf<(string | Record<string, any>)[]>()

	// check basic fields
	type TestQuery2 = Query<Schema, CollectionA>;

	expectTypeOf<TestQuery2['fields']>()
		.exclude<undefined>()
		// eslint-disable-next-line @typescript-eslint/ban-types
		.toEqualTypeOf<readonly ("id" | {} | "*")[]>();


	// why is one readonly and the other not!

})
