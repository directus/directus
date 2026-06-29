import { assets } from './assets/index.js';
import { collections } from './collections/index.js';
import { fields } from './fields/index.js';
import { files } from './files/index.js';
import { flows } from './flows/index.js';
import { folders } from './folders/index.js';
import { items } from './items/index.js';
import { operations } from './operations/index.js';
import { relations } from './relations/index.js';
import { schema } from './schema/index.js';
import { system } from './system/index.js';
import { triggerFlow } from './trigger-flow/index.js';
import type { ToolConfig } from './types.js';

export const ALL_TOOLS: ToolConfig<any>[] = [
	system,
	items,
	files,
	folders,
	assets,
	flows,
	triggerFlow,
	operations,
	schema,
	collections,
	fields,
	relations,
];

export const getAllMcpTools = () => ALL_TOOLS;

export const findMcpTool = (name: string) => ALL_TOOLS.find((tool) => tool.name === name);

export { collections, fields, files, flows, items, operations, relations, schema, system, triggerFlow };
export { createExecuteTool, createSearchTool, MountedToolRegistry, ToolRegistry } from './registry.js';
export type { RegistryError, RegistryExecuteResult, ToolDetail, ToolRegistryMountContext } from './registry.js';
export { createSearchIndex } from './search-index.js';
export type { SearchIndex, ToolSearchMatch, ToolSearchResults } from './search-index.js';
export { getToolTypeStrings, schemaToTypeString } from './schema-to-type-string.js';
