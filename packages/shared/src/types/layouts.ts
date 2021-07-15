import { Item } from './items';
import { Filter } from './presets';

export interface LayoutProps<Options = any, Query = any> {
	collection: string | null;
	selection: Item[];
	layoutOptions: Options;
	layoutQuery: Query;
	filter: Record<string, unknown> | null;
	filters: Filter[];
	searchQuery: string | null;
	selectMode: boolean;
	readonly: boolean;
	resetPreset?: () => Promise<void>;
}

export type LayoutState<T, Options, Query> = {
	props: LayoutProps<Options, Query>;
} & T;
