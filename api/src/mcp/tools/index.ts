import type { ToolConfig } from '../types.js';
import { assets } from './assets.js';
import { collections } from './collections.js';
import { fields } from './fields.js';
import { files } from './files.js';
import { flows } from './flows.js';
import { folders } from './folders.js';
import { items } from './items.js';
import { operations } from './operations.js';
import { relations } from './relations.js';
import { schema } from './schema.js';
import { system } from './system.js';
import { triggerFlow } from './trigger-flow.js';

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
