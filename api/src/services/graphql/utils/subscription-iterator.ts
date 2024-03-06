export class DeferredSubscription<T = Record<string, any>> {
	public active: boolean = true;
	public promise: Promise<T>;

	private resolver: ((value: T) => void) | null = null;

	constructor() {
		this.promise = new Promise((res) => (this.resolver = res));
		this.promise.then(() => (this.active = false));
	}

	reset() {
		this.active = true;
		this.resolver = null;
		this.promise = new Promise((res) => (this.resolver = res));
		this.promise.then(() => (this.active = false));
	}

	resolve(value: T) {
		if (this.resolver) this.resolver(value);
	}
}

export class SubscriptionIterator {
	deferred: Set<DeferredSubscription> = new Set([]);

	[Symbol.asyncIterator]() {
		const deferred = new DeferredSubscription();
		this.deferred.add(deferred);
		return {
			next: async () => {
				const value = await deferred.promise;
				deferred.reset();

				return { value, done: false };
			},
		};
	}

	async *subscribe(collection: string) {
		for await (const msg of this) {
			if (msg['collection'] === collection) {
				yield msg;
			}
		}
	}

	publish(message: Record<string, any>) {
		this.deferred.forEach((deferred) => {
			if (deferred.active) {
				deferred.resolve(message);
			} else {
				this.deferred.delete(deferred);
			}
		});
	}
}


let messageIterator: SubscriptionIterator | null = null;

export function useSubscriptionIterator(): SubscriptionIterator {
	if (messageIterator === null) {
		messageIterator = new SubscriptionIterator();
	}

	return messageIterator;
}
