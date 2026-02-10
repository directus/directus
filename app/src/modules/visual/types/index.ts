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
	rect?: DOMRect;
};

export type HighlightElementData = {
	key?: string | null;
	collection?: string;
	item?: PrimaryKey;
	fields?: string[];
};

export type ConfirmData = {
	aiEnabled: boolean;
};

export type ReceiveAction = 'connect' | 'edit' | 'navigation' | 'addToContext';

export type SendAction = 'confirm' | 'showEditableElements' | 'saved' | 'highlightElement';

/** Not shared with the package */

export type NavigationData = { url: string; title: string };

export type EditData = { key: string; editConfig: EditConfig; rect: DOMRect };

export type ReceiveData =
	| { action: 'connect'; data: null }
	| { action: 'edit'; data: EditData }
	| { action: 'navigation'; data: NavigationData }
	| { action: 'addToContext'; data: AddToContextData }
	| { action: null; data: null };
