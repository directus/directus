import { expect, test } from 'vitest';
import { getGlobalAccessUserCacheKey } from './get-global-access-user-cache-key.js';

test('Prefixes with gar, joins on _', () => {
	expect(getGlobalAccessUserCacheKey('user-a')).toBe('gau-user-a');
});
