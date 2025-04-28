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
	payload: Record<string, any>;
};

export type ReceiveAction = 'connect' | 'edit' | 'navigation';

export type SendAction = 'confirm' | 'showEditableElements' | 'saved';

/** Not shared with the package */

export type ReceiveData = { action: ReceiveAction | null; data: unknown };

export type NavigationData = { url: string; title: string };
