import { v5 as uuid } from 'uuid';

const DEFAULT_UUID_NAMESPACE = 'e81a0012-568b-415c-96fa-66508f594067';

type OptionsSeedGenerateBase = {
	length: number;
};

export type OptionsSeedGenerateInteger = OptionsSeedGenerateBase & {
	integerStartsAt?: number;
};

export type OptionsSeedGenerateString = OptionsSeedGenerateBase & {
	stringStartsWith?: string;
	stringEndsWith?: string;
	seed?: string;
};

export type OptionsSeedGenerateUUID = OptionsSeedGenerateBase & {
	seed?: string;
};

export const SeedFunctions = {
	generateValues: {
		integer: generateInteger,
		bigInteger: generateInteger,
		uuid: generateUUID,
		string: generateString,
		text: generateString,
		// Unimplemented
		alias: generateEmpty,
		binary: generateEmpty,
		boolean: generateEmpty,
		csv: generateEmpty,
		date: generateEmpty,
		dateTime: generateEmpty,
		decimal: generateEmpty,
		float: generateEmpty,
		geometry: generateEmpty,
		hash: generateEmpty,
		json: generateEmpty,
		time: generateEmpty,
		timestamp: generateEmpty,
	},
};

function generateEmpty() {
	return [];
}

function generateInteger(options: OptionsSeedGenerateInteger) {
	const values = [];

	for (let i = 0; i < options.length; i++) {
		if (options.integerStartsAt) {
			values.push(options.integerStartsAt + i);
		} else {
			values.push(i);
		}
	}

	return values;
}

function generateString(options: OptionsSeedGenerateString) {
	const values = [];

	for (let i = 0; i < options.length; i++) {
		let value = uuid(String(i), options.seed ?? DEFAULT_UUID_NAMESPACE);
		if (options.stringStartsWith) {
			value = options.stringStartsWith + value;
		}
		if (options.stringEndsWith) {
			value = value + options.stringEndsWith;
		}
		values.push(value);
	}

	return values;
}

function generateUUID(options: OptionsSeedGenerateUUID) {
	const values = [];

	for (let i = 0; i < options.length; i++) {
		values.push(uuid(String(i), options.seed ?? DEFAULT_UUID_NAMESPACE));
	}

	return values;
}
