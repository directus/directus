import Cookies from 'universal-cookie';
import { expect, test, vi } from 'vitest';

test('importing auth does not register a module scoped cookie change listener', async () => {
	const addChangeListenerSpy = vi.spyOn(Cookies.prototype, 'addChangeListener');

	// universal-cookie starts polling document.cookie as soon as a change listener is
	// registered. A change listener registered at module scope has no scope to dispose it,
	// so the polling interval outlives the test environment and throws
	// "document is not defined" after teardown, intermittently failing the test run.
	await import('./auth');

	expect(addChangeListenerSpy).not.toHaveBeenCalled();

	addChangeListenerSpy.mockRestore();
	// Importing auth pulls in a large module graph, which can exceed the default timeout
	// while it is transformed on a cold cache.
}, 30_000);
