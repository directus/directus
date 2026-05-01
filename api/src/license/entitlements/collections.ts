/**
 * 
 */

import { isSystemCollection } from '@directus/system-data';
import { getSchema } from '../../utils/get-schema.js';
import { entitlementManager } from './manager.js';


/**
 * Counting the current user collections
 */
async function countActiveCollections() {
    const schema = await getSchema();

    return Object.keys(schema.collections)
		  .filter((collection) => !isSystemCollection(collection))
      // TODO dont forget to filter out hidden collections when implemented
      .length;
}

entitlementManager.registerCounter('collections', countActiveCollections);