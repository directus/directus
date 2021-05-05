export class Debouncer<T extends any = any> {
	private func: (...args: any[]) => Promise<T>;
	private debounced: {
		resolve: (value: T) => void;
		reject: (error: Error) => void;
	}[];
	private debouncing: boolean;

	constructor(func: (...args: any[]) => Promise<T>) {
		this.func = func;
		this.debounced = [];
		this.debouncing = false;
	}

	async debounce<P extends any>(...args: P[]): Promise<T> {
		if (this.debouncing) {
			return await new Promise<T>((resolve, reject) => {
				this.debounced.push({
					resolve: (value) => resolve(value),
					reject: (error) => reject(error),
				});
			});
		}

		this.debouncing = true;

		return new Promise((resolve, reject) => {
			this.func(...args)
				.then((value) => {
					const promises = [{ resolve, reject }, ...this.debounced];
					this.debounced = [];
					this.debouncing = false;
					promises.forEach((promise) => promise.resolve(value));
				})
				.catch((error) => {
					const promises = [{ resolve, reject }, ...this.debounced];
					this.debounced = [];
					this.debouncing = false;
					promises.forEach((promise) => promise.reject(error));
				});
		});
	}
}
