/**
 * File to run some tests / experiments. Not intended for prod usage
 */
import { readItems } from './commands/items/read.js';
import { useDirectus } from './index.js';

interface MySchema {
	testCollection: {
		testField: string;
	};
	secondTestCollection: {
		anotherTestField: string;
	};
}

const client = useDirectus<MySchema>({ url: 'https://debug.directus.app' });
const readData = await client.exec(readItems({ collection: 'secondTestCollection' }));
