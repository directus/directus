import type { ToolConfig } from '../tool.js';
import { items } from './items.js';
import { system } from './system.js';


export const ALL_TOOLS: ToolConfig<any>[] = [
    items,
    system,
];

export { items, system };