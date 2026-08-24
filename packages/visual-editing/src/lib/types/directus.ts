import type { PrimaryKey } from '@directus/types';

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

export type CheckFieldAccessData = {
	key: string;
	collection: EditConfig['collection'];
	item: EditConfig['item'];
	fields: string[];
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
	theme?: VisualEditingTheme;
	messages?: VisualEditingMessages;
};

export type VisualEditingTheme = {
	primaryColor: string | undefined;
	primaryAccentColor: string | undefined;
	borderRadius: string | undefined;
	buttonSize: string | undefined;
	focusRingWidth: string | undefined;
	focusRingOffset: string | undefined;
};

export type VisualEditingMessages = {
	edit: string;
	addToContext: string;
};

export type ReceiveAction = 'connect' | 'checkFieldAccess' | 'edit' | 'navigation' | 'addToContext';

export type SendAction = 'confirm' | 'activateElements' | 'showEditableElements' | 'saved' | 'highlightElement';
