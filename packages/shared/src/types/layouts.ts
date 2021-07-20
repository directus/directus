import { Item } from './items';
import { AppFilter } from './presets';

export interface LayoutProps<Options = any, Query = any> {
	collection: string | null;
	selection: Item[];
	layoutOptions: Options;
	layoutQuery: Query;
	filters: AppFilter[];
	searchQuery: string | null;
	selectMode: boolean;
	readonly: boolean;
	resetPreset?: () => Promise<void>;
}

export type LayoutState<T, Options, Query> = {
	props: LayoutProps<Options, Query>;
} & T;
