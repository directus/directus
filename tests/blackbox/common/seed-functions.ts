import type { PrimaryKeyType } from '@common/types';
import seedrandom from 'seedrandom';
import { v5 as uuid } from 'uuid';

const SEED_UUID_NAMESPACE = 'e81a0012-568b-415c-96fa-66508f594067';
const FIVE_YEARS_IN_MILLISECONDS = 5 * 365 * 24 * 60 * 60 * 1000;

type OptionsSeedGenerateBase = {
	quantity: number;
	seed?: string;
	vendor?: string;
	isDefaultValue?: boolean;
};

export type OptionsSeedGeneratePrimaryKeys = OptionsSeedGenerateBase & OptionsSeedGenerateInteger;

export type OptionsSeedGenerateInteger = OptionsSeedGenerateBase & {
	startsAt?: number;
	incremental?: boolean;
};

export type OptionsSeedGenerateBigInteger = OptionsSeedGenerateBase;

export type OptionsSeedGenerateString = OptionsSeedGenerateBase & {
	startsWith?: string;
	endsWith?: string;
};

export type OptionsSeedGenerateUUID = OptionsSeedGenerateBase;

export type OptionsSeedGenerateBoolean = OptionsSeedGenerateBase;

export type OptionsSeedGenerateCSV = OptionsSeedGenerateBase;

export type OptionsSeedGenerateDate = OptionsSeedGenerateBase & {
	startsFrom?: Date | string;
	endsOn?: Date | string;
};

export type OptionsSeedGenerateDateTime = OptionsSeedGenerateTimestamp;

export type OptionsSeedGenerateDecimal = OptionsSeedGenerateFloat;

export type OptionsSeedGenerateFloat = OptionsSeedGenerateBase & {
	startsAt?: number;
	endsAt?: number;
	amount?: number;
	precision?: number;
};

export type OptionsSeedGenerateGeometry = OptionsSeedGenerateBase;

export type OptionsSeedGenerateHash = OptionsSeedGenerateBase;

export type OptionsSeedGenerateJSON = OptionsSeedGenerateBase;

export type OptionsSeedGenerateTime = OptionsSeedGenerateBase & {
	startsFrom?: Date | string;
	endsOn?: Date | string;
};

export type OptionsSeedGenerateTimestamp = OptionsSeedGenerateBase & {
	startsFrom?: Date;
	endsOn?: Date;
};

export const SeedFunctions = {
	generatePrimaryKeys,
	generateValues: {
		integer: generateInteger,
		bigInteger: generateBigInteger,
		uuid: generateUUID,
		string: generateString,
		text: generateString,
		boolean: generateBoolean,
		csv: generateCSV,
		date: generateDate,
		dateTime: generateDateTime,
		decimal: generateDecimal,
		float: generateFloat,
		// geometry: null,
		// hash: null,
		// json: null,
		time: generateTime,
		timestamp: generateTimestamp,
	},
};

function generatePrimaryKeys(pkType: PrimaryKeyType, options: OptionsSeedGeneratePrimaryKeys) {
	switch (pkType) {
		case 'integer':
			return generateInteger(options);
		case 'uuid':
			return generateUUID(options);
		case 'string':
			return generateString(options);
		default:
			throw new Error(`Unsupported primary key type: ${pkType}`);
	}
}

function generateInteger(options: OptionsSeedGenerateInteger) {
	const random = seedrandom.xor128(options.seed ?? 'default');
	const values = [];

	if (options.incremental) {
		const randomStartValue = random.int32();

		for (let i = 0; i < options.quantity; i++) {
			if (options.startsAt) {
				values.push(options.startsAt + i);
			} else {
				values.push(randomStartValue + i);
			}
		}
	} else {
		for (let i = 0; i < options.quantity; i++) {
			if (options.startsAt) {
				values.push(random.int32() + options.startsAt + i);
			} else {
				values.push(random.int32() + i);
			}
		}
	}

	return values;
}

function generateBigInteger(options: OptionsSeedGenerateBigInteger) {
	const random = seedrandom.xor128(options.seed ?? 'default');
	const values = [];

	for (let i = 0; i < options.quantity; i++) {
		// TODO: Maximise array length back to 15, fix filter parsing which reduces this value
		const hexString = Array(12)
			.fill(0)
			.map(() => Math.round(random() * 0xf).toString(16))
			.join('');

		values.push(BigInt(`0x7${hexString}`));
	}

	return values;
}

function generateFloat(options: OptionsSeedGenerateFloat) {
	const random = seedrandom.xor128(options.seed ?? 'default');
	const values = [];

	for (let i = 0; i < options.quantity; i++) {
		if (options.startsAt && options.endsAt) {
			values.push(
				Number((options.startsAt + random() * (options.endsAt - options.startsAt + 1)).toFixed(options.precision ?? 3)),
			);
		} else if (options.startsAt) {
			values.push(Number((options.startsAt + random() * (options.amount ?? 100)).toFixed(options.precision ?? 3)));
		} else if (options.endsAt) {
			values.push(Number((options.endsAt - random() * (options.amount ?? 100)).toFixed(options.precision ?? 3)));
		} else {
			values.push(Number((random() * (options.amount ?? 100)).toFixed(options.precision ?? 3)));
		}
	}

	return values;
}

function generateDecimal(options: OptionsSeedGenerateDecimal) {
	return generateFloat(options);
}

function generateString(options: OptionsSeedGenerateString) {
	const values = [];

	for (let i = 0; i < options.quantity; i++) {
		let value = uuid(String((options.seed ?? 'default') + i), SEED_UUID_NAMESPACE).replace(/-/g, '');

		if (options.startsWith) {
			value = options.startsWith + value;
		}

		if (options.endsWith) {
			value = value + options.endsWith;
		}

		values.push(value);
	}

	return values;
}

function generateUUID(options: OptionsSeedGenerateUUID) {
	const values = [];

	for (let i = 0; i < options.quantity; i++) {
		values.push(uuid(String((options.seed ?? 'default') + i), SEED_UUID_NAMESPACE));
	}

	return values;
}

function generateBoolean(options: OptionsSeedGenerateBoolean) {
	const random = seedrandom.xor128(options.seed ?? 'default');
	const values = [];

	for (let i = 0; i < options.quantity; i++) {
		values.push(random() >= 0.5);
	}

	// Ensure that there is always true and false values to test on
	if (options.quantity >= 2) {
		values[0] = true;
		values[1] = false;
	}

	return values;
}

function generateCSV(options: OptionsSeedGenerateCSV) {
	const values = [];

	for (let i = 0; i < options.quantity; i++) {
		values.push(uuid(String((options.seed ?? 'default') + i), SEED_UUID_NAMESPACE));
	}

	return values;
}

function generateDate(options: OptionsSeedGenerateDate) {
	const random = seedrandom.xor128(options.seed ?? 'default');
	const values = [];

	if (typeof options.startsFrom === 'string') {
		options.startsFrom = new Date(Date.parse(options.startsFrom));
	}

	if (typeof options.endsOn === 'string') {
		options.endsOn = new Date(Date.parse(options.endsOn));
	}

	if (options.startsFrom && options.endsOn) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(
				new Date(
					Math.floor(
						random() * (options.endsOn.getTime() - options.startsFrom.getTime() + 1) + options.startsFrom.getTime(),
					),
				)
					.toISOString()
					.substring(0, 10),
			);
		}
	} else if (options.startsFrom) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(
				new Date(Math.floor(random() * FIVE_YEARS_IN_MILLISECONDS + options.startsFrom.getTime()))
					.toISOString()
					.substring(0, 10),
			);
		}
	} else if (options.endsOn) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(new Date(Math.floor(random() * options.endsOn.getTime())).toISOString().substring(0, 10));
		}
	} else {
		for (let i = 0; i < options.quantity; i++) {
			values.push(new Date(Math.floor(random() * FIVE_YEARS_IN_MILLISECONDS)).toISOString().substring(0, 10));
		}
	}

	if (options.isDefaultValue && options.vendor === 'oracle') {
		values.forEach(
			(value, index) =>
				(values[index] = new Date(value)
					.toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'short',
						year: 'numeric',
					})
					.replace(/ /g, '-')),
		);
	}

	return values;
}

function generateDateTime(options: OptionsSeedGenerateDateTime) {
	const values = generateTimestamp(options);

	values.forEach((value, index) => (values[index] = value.slice(0, -5)));

	if (options.isDefaultValue && options.vendor === 'oracle') {
		for (let index = 0; index < values.length; index++) {
			values[index] = 'CURRENT_TIMESTAMP';
		}
	}

	return values;
}

function generateTime(options: OptionsSeedGenerateTime) {
	const random = seedrandom.xor128(options.seed ?? 'default');
	const values = [];
	let timeStart = options.startsFrom;
	let timeEnd = options.endsOn;

	if (typeof timeStart === 'string') {
		timeStart = new Date(`1970-01-01T${timeStart}`);
	}

	if (typeof timeEnd === 'string') {
		timeEnd = new Date(`1970-01-01T${timeEnd}`);
	}

	if (timeStart && timeEnd) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(
				new Date(Math.floor(random() * (timeEnd.getTime() - timeStart.getTime() + 1) + timeStart.getTime()))
					.toISOString()
					.slice(11, 19),
			);
		}
	} else if (timeStart) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(
				new Date(Math.floor(random() * (86400000 /* 24h */ - timeStart.getTime()) + timeStart.getTime()))
					.toISOString()
					.slice(11, 19),
			);
		}
	} else if (timeEnd) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(new Date(Math.floor(random() * timeEnd.getTime())).toISOString().slice(11, 19));
		}
	} else {
		for (let i = 0; i < options.quantity; i++) {
			values.push(new Date(Math.floor(random() * FIVE_YEARS_IN_MILLISECONDS)).toISOString().slice(11, 19));
		}
	}

	if (options.isDefaultValue && options.vendor === 'oracle') {
		for (let index = 0; index < values.length; index++) {
			values[index] = 'CURRENT_TIMESTAMP';
		}
	}

	return values;
}

function generateTimestamp(options: OptionsSeedGenerateTimestamp) {
	const random = seedrandom.xor128(options.seed ?? 'default');
	const values = [];

	if (options.startsFrom && options.endsOn) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(
				new Date(
					Math.floor(
						random() * (options.endsOn.getTime() - options.startsFrom.getTime() + 1) + options.startsFrom.getTime(),
					),
				).toISOString(),
			);
		}
	} else if (options.startsFrom) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(
				new Date(Math.floor(random() * FIVE_YEARS_IN_MILLISECONDS + options.startsFrom.getTime())).toISOString(),
			);
		}
	} else if (options.endsOn) {
		for (let i = 0; i < options.quantity; i++) {
			values.push(new Date(Math.floor(random() * options.endsOn.getTime())).toISOString());
		}
	} else {
		for (let i = 0; i < options.quantity; i++) {
			values.push(new Date(Math.floor(random() * FIVE_YEARS_IN_MILLISECONDS)).toISOString());
		}
	}

	// Overcome MySQL / Maria created without decimal accuracy
	// Overcome MSSQL specific accuracy up to 1/300th of a second
	values.forEach((value, index) => (values[index] = value.slice(0, 20) + '000Z'));

	if (options.isDefaultValue && options.vendor) {
		if (['mysql', 'mysql5', 'maria'].includes(options.vendor)) {
			values.forEach(
				(value, index) => (values[index] = new Date(value).toISOString().replace(/([^T]+)T([^.]+).*/g, '$1 $2')),
			);
		} else if (options.vendor === 'oracle') {
			values.forEach((_, index) => (values[index] = 'CURRENT_TIMESTAMP'));
		}
	}

	return values;
}
