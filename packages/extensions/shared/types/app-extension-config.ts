import type { DisplayConfig } from './displays.js';
import type { InterfaceConfig } from './interfaces.js';
import type { LayoutConfig } from './layouts.js';
import type { ModuleConfig } from './modules.js';
import type { PanelConfig } from './panels.js';
import type { OperationAppConfig } from './operations.js';

export type AppExtensionConfigs = {
	interfaces: InterfaceConfig[];
	displays: DisplayConfig[];
	layouts: LayoutConfig[];
	modules: ModuleConfig[];
	panels: PanelConfig[];
	operations: OperationAppConfig[];
};
