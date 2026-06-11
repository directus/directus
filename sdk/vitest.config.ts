import { systemCollectionNames } from '@directus/system-data';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	define: {
		__SYSTEM_COLLECTION_NAMES__: JSON.stringify(systemCollectionNames),
	},
});
