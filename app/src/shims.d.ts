declare module '*.vue' {
	import { DefineComponent } from 'vue';
	// eslint-disable-next-line @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

declare module '*.md' {
	import { DefineComponent } from 'vue';
	// eslint-disable-next-line @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

declare module '*.yaml' {
	const value: Record<string, any>;
	export default value;
}

declare module '*.json' {
	const value: Record<string, any>;
	export default value;
}

declare module 'jsonlint-mod' {
	const x: any;
	export default x;
}

declare module 'frappe-charts/src/js/charts/AxisChart' {
	export class Chart {
		constructor(element: string, options: Record<string, any>);
	}
}

declare module '@directus-extensions-interface' {
	import { InterfaceConfig } from '@directus/shared/types';
	const interfaces: InterfaceConfig[];
	export default interfaces;
}

declare module '@directus-extensions-display' {
	import { DisplayConfig } from '@directus/shared/types';
	const displays: DisplayConfig[];
	export default displays;
}

declare module '@directus-extensions-layout' {
	import { LayoutConfig } from '@directus/shared/types';
	const layouts: LayoutConfig[];
	export default layouts;
}

declare module '@directus-extensions-panel' {
	import { PanelConfig } from '@directus/shared/types';
	const panel: PanelConfig[];
	export default panel;
}

declare module '@directus-extensions-module' {
	import { ModuleConfig } from '@directus/shared/types';
	const modules: ModuleConfig[];
	export default modules;
}
