const enum Types {
	NULL = 'null',
	UNDEFINED = 'undefined',
	STRING = 'string',
	INTEGER = 'integer',
	FLOAT = 'float',
	BOOLEAN = 'boolean',
	EMPTY = 'empty',
}

const enum Tokens {
	'TRUE' = -1,
	'FALSE' = -2,
	'NULL' = -3,
	'EMPTY' = -4,
	'UNDEFINED' = -5,
}

type Token = {
	type: Types;
	index: number;
};

type NestedToken = ['@' | '$', ...(Token | NestedToken)[]];

/**
 * Compress any input object or array down to a minimal size reproduction in a string
 * Inspired by `jsonpack`
 */
export function compress(obj: Record<string, any> | Record<string, any>[]): string {
	const strings = new Map<string, number>();
	const integers = new Map<string, number>();
	const floats = new Map<number, number>();

	const getAst = (part: unknown | unknown[]): Token | NestedToken => {
		if (part === null) {
			return {
				type: Types.NULL,
				index: Tokens.NULL,
			};
		}

		if (part === undefined) {
			return {
				type: Types.UNDEFINED,
				index: Tokens.UNDEFINED,
			};
		}

		if (Array.isArray(part)) {
			return ['@', ...part.map((subPart) => getAst(subPart))];
		}

		if (part instanceof Date) {
			const value = encode(part.toJSON());

			if (strings.has(value)) {
				return {
					type: Types.STRING,
					index: strings.get(value)!,
				};
			}

			const index = strings.size;

			strings.set(value, index);

			return {
				type: Types.STRING,
				index,
			};
		}

		if (typeof part === 'object') {
			return [
				'$',
				...Object.entries(part)
					.map(([key, value]) => [getAst(key), getAst(value)])
					.flat(),
			];
		}

		if (part === '') {
			return {
				type: Types.EMPTY,
				index: Tokens.EMPTY,
			};
		}

		if (typeof part === 'string') {
			const value = encode(part);

			if (strings.has(value)) {
				return {
					type: Types.STRING,
					index: strings.get(value)!,
				};
			}

			const index = strings.size;

			strings.set(value, index);

			return {
				type: Types.STRING,
				index,
			};
		}

		if (typeof part === 'number' && Number.isInteger(part)) {
			const value = to36(part);

			if (integers.has(value)) {
				return {
					type: Types.INTEGER,
					index: integers.get(value)!,
				};
			}

			const index = integers.size;

			integers.set(value, index);

			return {
				type: Types.INTEGER,
				index,
			};
		}

		if (typeof part === 'number') {
			if (floats.has(part)) {
				return {
					type: Types.FLOAT,
					index: floats.get(part)!,
				};
			}

			const index = floats.size;

			floats.set(part, index);

			return {
				type: Types.FLOAT,
				index,
			};
		}

		if (typeof part === 'boolean') {
			return {
				type: Types.BOOLEAN,
				index: part ? Tokens.TRUE : Tokens.FALSE,
			};
		}

		throw new Error(`Unexpected argument of type ${typeof part}`);
	};

	const ast = getAst(obj);

	const getCompressed = (part: Token | NestedToken) => {
		if (Array.isArray(part)) {
			let compressed: string = part.shift() as '@' | '$';
			part.forEach((subPart) => (compressed += getCompressed(subPart as Token) + '|'));
			if (compressed.endsWith('|')) compressed = compressed.slice(0, -1);
			return compressed + ']';
		}

		const { type, index } = part;

		switch (type) {
			case Types.STRING:
				return to36(index);
			case Types.INTEGER:
				return to36(strings.size + index);
			case Types.FLOAT:
				return to36(strings.size + integers.size + index);
			default:
				return index;
		}
	};

	let compressed = mapToSortedArray(strings).join('|');
	compressed += '^' + mapToSortedArray(integers).join('|');
	compressed += '^' + mapToSortedArray(floats).join('|');
	compressed += '^' + getCompressed(ast);

	return compressed;
}

export function decompress(input: string): unknown {
	const parts = input.split('^');
	if (parts.length !== 4) throw new Error(`Invalid input string given`);

	const values: (string | number)[] = [];

	if (parts[0]) {
		values.push(...parts[0]!.split('|').map((part) => decode(part)));
	}

	if (parts[1]) {
		values.push(...parts[1]!.split('|').map((part) => to10(part)));
	}

	if (parts[2]) {
		values.push(...parts[2]!.split('|').map((part) => parseFloat(part)));
	}

	let num36Buffer = '';
	const tokens: (string | number)[] = [];

	parts[3]!.split('').forEach((symbol) => {
		if (['|', '$', '@', ']'].includes(symbol)) {
			if (num36Buffer) {
				tokens.push(to10(num36Buffer));
				num36Buffer = '';
			}

			if (symbol !== '|') tokens.push(symbol);
		} else {
			num36Buffer += symbol;
		}
	});

	let tokenIndex = 0;

	const getDecompressed = (): Record<string, any> | Record<string, any>[] => {
		const type = tokens[tokenIndex++];

		if (type === '$') {
			const node: Record<string, any> = {};

			for (; tokenIndex < tokens.length; tokenIndex++) {
				const rawKey = tokens[tokenIndex]!;

				if (rawKey === ']') return node;

				const rawValue = tokens[++tokenIndex]!;

				const key = values[rawKey as number] as string;

				if (rawValue === '$' || rawValue === '@') {
					node[key] = getDecompressed();
				} else {
					const value = values[rawValue as number] ?? getValueForToken(rawValue as Tokens);
					node[key] = value;
				}
			}
		}

		if (type === '@') {
			const node: any[] = [];

			for (; tokenIndex < tokens.length; tokenIndex++) {
				const rawValue = tokens[tokenIndex]!;

				if (rawValue === ']') return node;

				if (rawValue === '$' || rawValue === '@') {
					node.push(getDecompressed());
				} else {
					const value = values[tokens[tokenIndex]! as number] ?? getValueForToken(tokens[tokenIndex] as Tokens);
					node.push(value);
				}
			}
		}

		throw new Error('Bad token: ' + type);
	};

	return getDecompressed();
}

export function mapToSortedArray(map: Map<string | number, number>): (string | number)[] {
	const output: (string | number)[] = [];

	map.forEach((index, value) => {
		output[index] = value;
	});

	return output;
}

export function encode(str: string): string {
	return str.replace(/[+ |^%]/g, (a) => {
		switch (a) {
			case ' ':
				return '+';
			case '+':
				return '%2B';
			case '|':
				return '%7C';
			case '^':
				return '%5E';
			case '%':
			default:
				// The regex matches explicit, so this default shouldn't be hit
				return '%25';
		}
	});
}

export function decode(str: string): string {
	return str.replace(/\+|%2B|%7C|%5E|%25/g, (a) => {
		switch (a) {
			case '%25':
				return '%';
			case '%2B':
				return '+';
			case '%7C':
				return '|';
			case '%5E':
				return '^';
			case '+':
			default:
				// The regex matches explicit, so this default shouldn't be hit
				return ' ';
		}
	});
}

export function to36(num: number): string {
	return num.toString(36).toUpperCase();
}

export function to10(str: string): number {
	return parseInt(str, 36);
}

export function getValueForToken(token: Tokens): boolean | '' | null | undefined {
	switch (token) {
		case Tokens.TRUE:
			return true;
		case Tokens.FALSE:
			return false;
		case Tokens.NULL:
			return null;
		case Tokens.EMPTY:
			return '';
		case Tokens.UNDEFINED:
			return undefined;
	}
}
