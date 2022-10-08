export type LocalStorageObjectType = string | number | boolean | object | null;

export class LocalStorageObject {
	private readonly key: string;

	constructor(key: string, private readonly defaultValue?: LocalStorageObjectType) {
		this.key = `directus-${key}`;
	}

	getValue(): LocalStorageObjectType {
		const valueFromLocalStorage = localStorage.getItem(this.key);

		if (valueFromLocalStorage === null) {
			return this.defaultValue;
		}

		try {
			return JSON.parse(valueFromLocalStorage);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn(`Couldn't parse value from local storage`, e);

			return this.defaultValue;
		}
	}

	setValue(value: LocalStorageObjectType): LocalStorageObjectType {
		try {
			localStorage.setItem(this.key, JSON.stringify(value));
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn(`Couldn't stringify and set value to local storage`, e);

			return this.getValue();
		}

		return value;
	}

	clear() {
		localStorage.removeItem(this.key);
	}
}
