import { provide } from 'vue';
import api from '@/api';
import * as stores from '@/stores';
import { API_INJECT, EXTENSIONS_INJECT, STORES_INJECT } from '@directus/shared/constants';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { getLayouts } from '@/layouts';
import { getModules } from '@/modules';
import { getPanels } from '@/panels';
import { getOperations } from '@/operations';

export default function useSystem(): void {
	provide(STORES_INJECT, stores);

	provide(API_INJECT, api);

	provide(EXTENSIONS_INJECT, {
		interfaces: getInterfaces().interfaces,
		displays: getDisplays().displays,
		layouts: getLayouts().layouts,
		modules: getModules().modules,
		panels: getPanels().panels,
		operations: getOperations().operations,
	});
}
