import type { SchemaOverview } from '@directus/types';
import { getNamingFn, pascalcase } from './naming.js';
import type { Nullable, RenderOptions } from './types.js';

const defaultOptions: RenderOptions = {
	rootName: 'MySchema',
	nameTransform: 'database',
	indent: {
		amount: 4,
		char: ' ',
	},
};

export function renderSchema(schema: SchemaOverview, options = defaultOptions) {
	let rootType = `export interface ${options.rootName} {\n`;

	const nameFn = getNamingFn(options.nameTransform);
	const sortedNames = Object.keys(schema.collections).sort();
	const indentation = options.indent.char.repeat(options.indent.amount);

	for (const name of sortedNames) {
		const collection = schema.collections[name];
		if (!collection) continue;

		rootType += `${indentation}${name}: ${nameFn(collection.collection)}${fmtArray(!collection.singleton)};\n`;
	}

	rootType += '}\n\n';

	const collectionSchema = [];
	const systemImports = new Set<string>();

	for (const name of sortedNames) {
		const collection = schema.collections[name];
		if (!collection) continue;

		let collectionType = `interface ${nameFn(collection.collection)} {\n`;

		const pk = collection.fields[collection.primary];
		const sortedFieldNames = Object.keys(collection.fields).sort();

		if (pk) {
			// pull the primary key to the top
			collectionType += `${indentation}${pk.field}: ${makeArray(pk.type).join(' | ')};\n`;
		}

		for (const fieldName of sortedFieldNames) {
			const field = collection.fields[fieldName];

			if (fieldName === collection.primary || !field) continue;

			const fieldTypes = makeArray(field.type);

			// TODO fix relations
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
				fieldTypes.push('null');
			}

			collectionType += `${indentation}${field.field}: ${fieldTypes.join(' | ')};\n`;
		}

		collectionType += '}';
		collectionSchema.push(collectionType);
	}

	const importStr =
		systemImports.size > 0 ? `import { ${[...systemImports].join(', ')} } from '@directus/sdk';\n\n` : '';

	return importStr + rootType + collectionSchema.join('\n\n');
}

function fmtArray(isArray: boolean) {
	return isArray ? '[]' : '';
}

function makeArray<T>(item: Nullable<T | T[]>): T[] {
	if (!item) return [];
	return Array.isArray(item) ? item : [item];
}
