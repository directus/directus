import TabularLayout from './tabular/';
import { LayoutConfig } from '@/types/extensions';
import { registerComponent } from '@/utils/register-component';
import { useExtensionsStore } from '@/stores/extensions';
import { i18n } from '@/lang';

const lib = {
	registerLayout,
	registerGlobalLayouts
};

export default lib;

export function registerLayout(config: LayoutConfig) {
	const extensionsStore = useExtensionsStore();
	registerComponent(`layout-${config.id}`, config.component);

	const name = typeof config.name === 'function' ? config.name(i18n) : config.name;

	const layoutForStore = {
		id: config.id,
		name: name,
		icon: config.icon
	};

	extensionsStore.state.layouts = [...extensionsStore.state.layouts, layoutForStore];
}

export function registerGlobalLayouts() {
	[TabularLayout].forEach(lib.registerLayout);
}
