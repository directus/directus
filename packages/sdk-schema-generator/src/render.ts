import { pascalcase } from "./naming.js";
import type { Nullable, SchemaDefinition } from "./types.js";

export type RenderOptions = {
	rootName: string;
	indent: {
		amount: number;
		char: string;
	};
}

export const defaultOptions: RenderOptions = {
	rootName: 'MySchema',
	indent: {
		amount: 4,
		char: ' ',
	},
};

function fmtArray(isArray: boolean) {
	return isArray ? '[]' : '';
}

function makeArray<T>(item: Nullable<T | T[]>): T[] {
	if (!item) return [];
	return Array.isArray(item) ? item : [item];
}

export function renderSchemaTypes(schema: SchemaDefinition, options = defaultOptions) {
	const sortedNames = [...schema.keys()].sort();
	let rootType = `interface ${options.rootName} {\n`;
	const indentation = options.indent.char.repeat(options.indent.amount);

	for (const name of sortedNames) {
		const collection = schema.get(name);
		if (!collection) continue;

		rootType += `${indentation}${name}: ${collection.name}${fmtArray(!collection.singleton)};\n`;
	}

	rootType += '}\n\n';

	const collectionSchema = [];
	const systemImports = new Set<string>();

	for (const name of sortedNames) {
		const collection = schema.get(name)!;
		let collectionType = `interface ${collection.name} {\n`;

		const pk = collection.fields.find(({ primary_key }) => primary_key);
		const sortedFields = collection.fields.sort((a, b) => (a.name > b.name) ? 1 : -1)

		if (pk) {
			// pull the primary key to the top
			collectionType += `${indentation}${pk.name}: ${makeArray(pk.type).join(' | ')};\n`;
		}

		for (const field of sortedFields) {
			if (field.primary_key) continue;

			const fieldTypes = makeArray(field.type);

			for (const relation of makeArray(field.relation)) {
				let relationName = '';

				if (relation?.collection.startsWith('directus_')) {
					const SystemName = pascalcase(relation.collection);
					relationName = `${SystemName}<${options.rootName}>`;
					systemImports.add(SystemName);
				} else if (schema.has(relation?.collection)) {
					relationName = schema.get(relation.collection)!.name;
				}

				fieldTypes.unshift(`${relationName}${fmtArray(relation.mutliple)}`);
			}

			if (field.nullable) {
				fieldTypes.push('null')
			}

			collectionType += `${indentation}${field.name}: ${fieldTypes.join(' | ')};\n`;
		}

		collectionType += '}';
		collectionSchema.push(collectionType);
	}

	const importStr = systemImports.size > 0
		? `import { ${[...systemImports].join(', ')} } from '@directus/sdk';\n\n`
		: '';

	return importStr + rootType + collectionSchema.join('\n\n');
}
