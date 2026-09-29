import { z } from 'zod';
import type { ToolConfig } from './types.js';

export type JsonSchema = {
	$defs?: Record<string, JsonSchema>;
	$ref?: string;
	anyOf?: JsonSchema[];
	oneOf?: JsonSchema[];
	allOf?: JsonSchema[];
	const?: unknown;
	description?: string;
	enum?: unknown[];
	type?: string | string[];
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema | JsonSchema[];
	prefixItems?: JsonSchema[];
	additionalProperties?: boolean | JsonSchema;
};

export type ToolTypeStrings = {
	inputType: string;
	outputType?: string;
};

const toolTypeStringCache = new WeakMap<ToolConfig<any>, ToolTypeStrings>();

export function getToolTypeStrings(tool: ToolConfig<any>): ToolTypeStrings {
	const cached = toolTypeStringCache.get(tool);

	if (cached) return cached;

	const types: ToolTypeStrings = {
		inputType: schemaToTypeString(z.toJSONSchema(tool.inputSchema, { io: 'input' }), 'Input'),
	};

	if (tool.output) {
		types.outputType = schemaToTypeString(z.toJSONSchema(tool.output), 'Output');
	}

	toolTypeStringCache.set(tool, types);

	return types;
}

export function schemaToTypeString(schema: unknown, rootName: string): string {
	const root = schema as JsonSchema;
	const rootReferenced = referencesRoot(root);
	const context = createContext(root, rootName, rootReferenced);

	const rootType = rootReferenced ? renderDeclaration(root, context, rootName) : renderSchema(root, context);

	const defs = renderDefs(context);

	return [...defs, rootType].join('\n\n');
}

type RenderContext = {
	defs: Record<string, JsonSchema>;
	defNames: Map<string, string>;
	rootName: string;
	usedNames: Set<string>;
};

function createContext(schema: JsonSchema, rootName: string, rootDeclared: boolean): RenderContext {
	const context: RenderContext = {
		defs: schema.$defs ?? {},
		defNames: new Map(),
		rootName,
		usedNames: new Set(rootDeclared ? [rootName] : []),
	};

	for (const key of Object.keys(context.defs).sort()) {
		context.defNames.set(key, getAvailableName(getDefinitionName(key), context.usedNames));
	}

	return context;
}

function referencesRoot(schema: JsonSchema | boolean | undefined): boolean {
	if (!schema || typeof schema === 'boolean') return false;
	if (schema.$ref === '#') return true;

	return [
		...Object.values(schema.$defs ?? {}),
		...(schema.anyOf ?? []),
		...(schema.oneOf ?? []),
		...(schema.allOf ?? []),
		...Object.values(schema.properties ?? {}),
		...getSchemaEntries(schema.items),
		...(schema.prefixItems ?? []),
		...(typeof schema.additionalProperties === 'object' ? [schema.additionalProperties] : []),
	].some((child) => referencesRoot(child));
}

function getSchemaEntries(entries: JsonSchema | JsonSchema[] | undefined): JsonSchema[] {
	if (!entries) return [];

	return Array.isArray(entries) ? entries : [entries];
}

function getSchemaTypes(schema: JsonSchema): string[] {
	if (!schema.type) return [];

	return Array.isArray(schema.type) ? schema.type : [schema.type];
}

function renderDefs(context: RenderContext): string[] {
	return Object.keys(context.defs)
		.sort()
		.map((key) => renderDeclaration(context.defs[key]!, context, context.defNames.get(key)!));
}

function renderDeclaration(schema: JsonSchema | boolean | undefined, context: RenderContext, name: string): string {
	if (canRenderInterface(schema)) {
		return `interface ${name} ${renderObject(schema, context)}`;
	}

	return `type ${name} = ${renderSchema(schema, context)};`;
}

function renderSchema(schema: JsonSchema | boolean | undefined, context: RenderContext): string {
	if (schema === false) return 'never';
	if (!schema || schema === true) return 'unknown';

	if (schema.$ref) return renderRef(schema.$ref, context);
	if ('const' in schema) return renderLiteral(schema.const);
	if (schema.enum) return renderUnion(schema.enum.map(renderLiteral));
	if (schema.anyOf) return renderUnion(schema.anyOf.map((entry) => renderSchema(entry, context)));
	if (schema.oneOf) return renderUnion(schema.oneOf.map((entry) => renderSchema(entry, context)));

	if (schema.allOf) {
		return schema.allOf.map((entry) => parenthesizeUnion(renderSchema(entry, context))).join(' & ');
	}

	const types = getSchemaTypes(schema);

	if (types.length > 1) {
		return renderUnion(types.map((type) => renderSchema({ ...schema, type }, context)));
	}

	switch (types[0]) {
		case 'object':
			return renderObject(schema, context);
		case 'array':
			return renderArray(schema, context);
		case 'string':
			return 'string';
		case 'number':
		case 'integer':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'null':
			return 'null';
		default:
			return renderUnknownSchema(schema, context);
	}
}

function canRenderInterface(schema: JsonSchema | boolean | undefined): schema is JsonSchema {
	if (!schema || typeof schema === 'boolean') return false;
	if (schema.$ref || schema.anyOf || schema.oneOf || schema.allOf || 'const' in schema || schema.enum) return false;

	const types = getSchemaTypes(schema);

	if (types.length > 1) return false;

	const isObjectLike = types[0] === 'object' || !!schema.properties;
	const hasNamedProperties = Object.keys(schema.properties ?? {}).length > 0;

	return isObjectLike && (hasNamedProperties || schema.additionalProperties === false);
}

function renderRef(ref: string, context: RenderContext): string {
	if (ref === '#') return context.rootName;

	const prefix = '#/$defs/';

	if (ref.startsWith(prefix)) {
		const key = decodeJsonPointerToken(decodeURIComponent(ref.slice(prefix.length)));

		return context.defNames.get(key) ?? 'unknown';
	}

	return 'unknown';
}

function renderUnknownSchema(schema: JsonSchema, context: RenderContext): string {
	if (schema.properties || schema.additionalProperties) {
		return renderObject(schema, context);
	}

	if (schema.items || schema.prefixItems) {
		return renderArray(schema, context);
	}

	return 'unknown';
}

function renderObject(schema: JsonSchema, context: RenderContext): string {
	const properties = schema.properties ?? {};
	const required = new Set(schema.required ?? []);
	const entries = Object.entries(properties);
	const additional = schema.additionalProperties;

	if (entries.length === 0 && additional && typeof additional === 'object') {
		return `Record<string, ${renderSchema(additional, context)}>`;
	}

	if (entries.length === 0) {
		return additional === false ? '{}' : 'Record<string, unknown>';
	}

	const lines = entries.flatMap(([key, property]) => {
		const optional = required.has(key) ? '' : '?';
		const description = renderDescription(property.description);
		const member = `${formatPropertyKey(key)}${optional}: ${renderSchema(property, context)};`;

		return description ? [description, member] : [member];
	});

	if (additional && typeof additional === 'object') {
		const additionalType = renderSchema(additional, context);
		const propertyTypes = entries.map(([, property]) => renderSchema(property, context));

		lines.push(`[key: string]: ${renderUnion([additionalType, ...propertyTypes])};`);
	} else if (additional === true) {
		lines.push('[key: string]: unknown;');
	}

	return `{\n${indent(lines.join('\n'))}\n}`;
}

function renderArray(schema: JsonSchema, context: RenderContext): string {
	if (schema.prefixItems) {
		return `[${schema.prefixItems.map((item) => renderSchema(item, context)).join(', ')}]`;
	}

	if (Array.isArray(schema.items)) {
		return `[${schema.items.map((item) => renderSchema(item, context)).join(', ')}]`;
	}

	return `${parenthesizeUnion(renderSchema(schema.items, context))}[]`;
}

function renderUnion(types: string[]): string {
	const uniqueTypes = [...new Set(types)];

	if (uniqueTypes.length === 0) return 'never';

	return uniqueTypes.join(' | ');
}

function renderLiteral(value: unknown): string {
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value);
	return 'unknown';
}

function renderDescription(description: string | undefined): string | undefined {
	if (!description) return;

	const escaped = description.replaceAll('*/', '*\\/').trim();

	return `/** ${escaped} */`;
}

function parenthesizeUnion(type: string): string {
	return type.includes(' | ') ? `(${type})` : type;
}

function indent(value: string): string {
	return value
		.split('\n')
		.map((line) => `\t${line}`)
		.join('\n');
}

function formatPropertyKey(key: string): string {
	return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function getDefinitionName(key: string): string {
	const name = key
		.split(/[^A-Za-z0-9_$]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');

	if (!name) return 'Schema';
	if (/^\d/.test(name)) return `Schema${name}`;

	return name;
}

function decodeJsonPointerToken(value: string): string {
	return value.replaceAll('~1', '/').replaceAll('~0', '~');
}

function getAvailableName(baseName: string, usedNames: Set<string>): string {
	let name = baseName;
	let index = 1;

	while (usedNames.has(name)) {
		name = index === 1 ? `${baseName}Def` : `${baseName}Def${index}`;
		index++;
	}

	usedNames.add(name);

	return name;
}
