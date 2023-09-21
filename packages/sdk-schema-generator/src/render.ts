import type { SchemaDefinition } from "./types.js";

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
		amount: 2,
		char: ' ',
	},
};

export function renderSchemaTypes(schema: SchemaDefinition, options = defaultOptions) {
	const sortedNames = [...schema.keys()].sort();
	let rootType = `interface ${options.rootName} {\n`;
	const indentation = options.indent.char.repeat(options.indent.amount);

	for (const name of sortedNames) {
		const collection = schema.get(name);
		if (!collection) continue;

		rootType += `${indentation}${name}: ${collection.name}${!collection.singleton ? '[]' : ''};\n`;
	}

	rootType += '}\n\n';

	const collectionSchema = sortedNames.map((name) => {
		const collection = schema.get(name)!;
		let collectionType = `interface ${collection.name} {\n`;

		const pk = collection.fields.find(({ primary_key }) => primary_key);

		if (pk) {
			collectionType += `${indentation}${pk.name}: ${pk.type};\n`;
		}

		for (const field of collection.fields) {
			if (field.primary_key) continue;

			const fieldTypes = [field.type];

			if (field.relation) {
				const relatedCollection = schema.get(field.relation.collection);
				fieldTypes.unshift(`${relatedCollection?.name ?? field.relation.collection}${field.relation.mutliple ? '[]' : ''}`);
			}

			if (field.nullable) {
				fieldTypes.push('null')
			}

			collectionType += `${indentation}${field.name}: ${fieldTypes.join(' | ')};\n`;
		}

		collectionType += '}';
		return collectionType;
	});

	return rootType + collectionSchema.join('\n\n');
}
