import type { Theme } from '@directus/themes';
import type { DisplayConfig } from './displays.js';
import type { InterfaceConfig } from './interfaces.js';
import type { LayoutConfig } from './layouts.js';
import type { ModuleConfig } from './modules.js';
import type { OperationAppConfig } from './operations.js';
import type { PanelConfig } from './panels.js';

export type AppExtensionConfigs = {
	interfaces: InterfaceConfig[];
	displays: DisplayConfig[];
	layouts: LayoutConfig[];
	modules: ModuleConfig[];
	panels: PanelConfig[];
	themes: Theme[];
	operations: OperationAppConfig[];
};
