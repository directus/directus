# App Test Utilities

Shared mocking utilities for app tests. These utilities help reduce code duplication and provide consistent mocking
patterns across app tests.

## Overview

This directory contains mock implementations for commonly used modules in app tests:

- **[sdk.ts](#sdkts)** - SDK client mocks for testing Directus API interactions

## File Documentation

### sdk.ts

Provides SDK mocking utilities for the app's SDK client (`@/sdk`).

#### `mockSdk(handler?)`

Creates a standard SDK mock with pre-configured mocks for `sdk.request` and `requestEndpoint`.

**Parameters:**

- `handler` (optional): Custom function to handle SDK requests. Receives `RequestOptions` and returns a `Promise`.

**Returns:** Mock module object for `vi.mock()` with:

- `default`: Mocked SDK client with a `request` method
- `requestEndpoint`: Mock function for creating RestCommand objects

**Usage Patterns:**

##### Basic Mocking

Most tests use `mockSdk()` without a handler and control responses per-test:

```typescript
import sdk from '@/sdk';
import { vi } from 'vitest';

// Set up SDK mock
vi.mock('@/sdk', async () => {
	const { mockSdk } = await import('@/test-utils/sdk');
	return mockSdk();
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe('my test suite', () => {
	test('fetches item successfully', async () => {
		// Mock the response for this test
		vi.mocked(sdk.request).mockResolvedValue({ id: 1, name: 'Test Item' });

		// Run your code that uses the SDK
		const result = await myFunction();

		// Verify the result
		expect(result).toEqual({ id: 1, name: 'Test Item' });

		// Optionally inspect what was requested
		const requestCall = vi.mocked(sdk.request).mock.calls[0]![0]();
		expect(requestCall).toEqual({ path: '/items/posts/1', params: { fields: ['*'] } });
	});
});
```

##### Custom Handler

For tests requiring consistent request routing across multiple test cases:

```typescript
vi.mock('@/sdk', async () => {
	const { mockSdk } = await import('@/test-utils/sdk');
	return mockSdk(async ({ path, method }) => {
		if (path === '/items/posts/1') {
			return { id: 1, title: 'Test Post' };
		}
		if (path?.startsWith('/items/posts') && method === 'GET') {
			return [{ id: 1 }, { id: 2 }];
		}
		throw new Error(`Unmocked request: ${method} ${path}`);
	});
});
```

##### Inspecting Request Details

To verify what options were passed to `sdk.request`:

```typescript
// ... mocking

await functionThatUsesSDK();

// Get the RequestOptions by calling the RestCommand function
const command = vi.mocked(sdk.request).mock.calls[0]![0];
const requestOptions = command(); // Execute the command to get RequestOptions

expect(requestOptions).toMatchObject({
	path: '/items/posts',
	method: 'PATCH',
	body: { title: 'Updated Title' },
});
```
