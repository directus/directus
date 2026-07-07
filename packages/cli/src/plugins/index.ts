import type { PluginDefinition } from '../kernel/plugins/define.js';

// Core plugins are statically registered here — bundled, zero-config. The sync
// plugin lands here as the first core plugin.
export const corePlugins: readonly PluginDefinition[] = [];
