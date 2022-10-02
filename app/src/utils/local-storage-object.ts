type LocalStorageObjectType = string | number | boolean | object | null;

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
			return this.defaultValue;
		}
	}

	setValue(value: LocalStorageObjectType): LocalStorageObjectType {
		localStorage.setItem(this.key, JSON.stringify(value));

		return value;
	}

	clear() {
		localStorage.removeItem(this.key);
	}
}
