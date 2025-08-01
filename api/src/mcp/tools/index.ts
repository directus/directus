import type { ToolConfig } from '../tool.js';
import { files } from './files.js';
import { flows, operations } from './flows.js';
import { items } from './items.js';
import { collection, field, relation, schema } from './schema.js';
import { system } from './system.js';

export const ALL_TOOLS: ToolConfig<any>[] = [
	system,
	items,
	files,
	flows,
	operations,
	schema,
	collection,
	field,
	relation,
];

export const getAllMcpTools = () => ALL_TOOLS;

export const findMcpTool = (name: string) => ALL_TOOLS.find((tool) => tool.name === name);

export { collection, field, files, flows, items, operations, relation, schema, system };
