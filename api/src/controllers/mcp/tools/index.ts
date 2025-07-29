import type { ToolConfig } from '../tool.js';
import { files } from './files.js';
import { items } from './items.js';
import { schema } from './schema.js';
import { system } from './system.js';

export const ALL_TOOLS: ToolConfig<any>[] = [system, items, files, schema];

export { files, items, schema, system };
