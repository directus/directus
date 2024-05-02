import { describe, expect, test } from 'vitest';
import { DeferredSubscription, SubscriptionIterator } from './subscription-iterator.js';

describe('DeferredSubscription', () => {
	test('should resolve promise', async () => {
		const deferred = new DeferredSubscription();
		const promise = deferred.promise;

		deferred.resolve({ test: 1 });
		const result = await promise;
		expect(result).toEqual({ test: 1 });
	});

	test('should set itself as inactive after resolving', async () => {
		const deferred = new DeferredSubscription();

		expect(deferred.active).toBe(true);

		deferred.resolve({ test: 1 });
		await deferred.promise;

		expect(deferred.active).toBe(false);
	});

	test('should reset itself and create a new promise', async () => {
		const deferred = new DeferredSubscription();
		const promise = deferred.promise;
		deferred.resolve({ test: 1 });
		await deferred.promise;

		deferred.reset();
		expect(deferred.active).toBe(true);
		expect(deferred.promise).not.toBe(promise);
	});
});

describe('SubscriptionIterator', () => {
	test('should publish a message', async () => {
		const iterator = new SubscriptionIterator();
		const subscription = iterator[Symbol.asyncIterator]();

		iterator.publish({ collection: 'test' });

		const result = await subscription.next();
		expect(result).toEqual({ value: { collection: 'test' }, done: false });
	});

	test('should deliver messages for the subscribed collection', async () => {
		const iterator = new SubscriptionIterator();
		const subscription = iterator.subscribe('test');

		const nextCall = subscription[Symbol.asyncIterator]().next();

		iterator.publish({ collection: 'test' });

		const result = await nextCall;
		expect(result).toEqual({ value: { collection: 'test' }, done: false });
	});

	test('should only deliver messages for the subscribed collection', async () => {
		const iterator = new SubscriptionIterator();
		const messages = iterator.subscribe('test');

		const collectResults = async () => {
			const results = [];

			for await (const m of messages) {
				results.push(m);

				if (m['collection'] === 'test') {
					break;
				}
			}

			return results;
		};

		const collector = collectResults();

		iterator.publish({ collection: 'not_test' });
		iterator.publish({ collection: 'test' });

		const results = await collector;

		expect(results).toEqual([{ collection: 'test' }]);
	});
});
