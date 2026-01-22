import { PrimaryKey } from '@directus/types';

/** These types are shared with the visual-editing package */
/** Keep in sync with the package */

export type EditConfig = {
	collection: string;
	item: PrimaryKey | null;
	fields?: string[];
	mode?: 'drawer' | 'modal' | 'popover';
};

export type SavedData = {
	key: string;
	collection: EditConfig['collection'];
	item: EditConfig['item'];
	payload: Record<string, unknown>;
};

export type AddToContextData = {
	key: string;
	editConfig: EditConfig;
	displayValue: string;
	rect?: { top: number; left: number; width: number; height: number };
};

export type HighlightElementData = {
	key: string | null;
};

export type ReceiveAction = 'connect' | 'edit' | 'navigation' | 'add-to-context';

export type SendAction = 'confirm' | 'showEditableElements' | 'saved' | 'highlight-element';

/** Not shared with the package */

export type ReceiveData = { action: ReceiveAction | null; data: unknown };

export type NavigationData = { url: string; title: string };
