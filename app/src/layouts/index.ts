import { LayoutConfig } from '@directus/types';
import { sortBy } from 'lodash';

export function getInternalLayouts(): LayoutConfig[] {
	const layouts = import.meta.glob<LayoutConfig>('./*/index.ts', { import: 'default', eager: true });
	return sortBy(Object.values(layouts), 'id');
}
