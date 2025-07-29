import type { ToolConfig } from '../tool.js';
import { files } from './files.js';
import { items } from './items.js';
import { system } from './system.js';

export const ALL_TOOLS: ToolConfig<any>[] = [system, items, files];

export { files, items, system };
