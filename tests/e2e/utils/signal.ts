export class Signal<T> {
	private state: T;
	private listeners: Array<(state: T) => void> = [];

	constructor(initialState: T) {
		this.state = initialState;
	}

	get() {
		return this.state;
	}

	set(newState: T) {
		if (this.state === newState) return;

		this.state = newState;

		for (const listener of this.listeners) {
			listener(this.state);
		}
	}

	subscribe(listener: (state: T) => void) {
		this.listeners.push(listener);
	}

	unsubscribe(listener: (state: T) => void) {
		this.listeners = this.listeners.filter((l) => l !== listener);
	}

	waitFor<G>(condition: (state: T) => G | undefined, timeout = 10_000): Promise<G> {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error('Timeout waiting for condition'));
			}, timeout);

			const checkCondition = () => {
				const result = condition(this.state);

				if (result !== undefined) {
					clearTimeout(timeoutId);
					resolve(result);
				}
			};

			this.subscribe(checkCondition);
		});
	}
}
