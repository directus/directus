export const memoryStorage = () => {
	const store: Record<string, string> = {};

	return {
		get(name: string) {
			return store[name];
		},
		set(name: string, value: string) {
			store[name] = value;
		},
	};
};
