import type {
	EditConfig as DirectusEditConfig,
	ReceiveAction as DirectusReceiveAction,
	SendAction as DirectusSendAction,
	SavedData,
} from './directus.ts';

export type { SavedData, HighlightElementData, ConfirmData, CheckFieldAccessData } from './directus.ts';

export type EditConfigStrict = DirectusEditConfig;

export type EditConfig = Omit<EditConfigStrict, 'fields'> & { fields?: EditConfigStrict['fields'] | string };

export type SendAction = DirectusReceiveAction;
export type ReceiveAction = DirectusSendAction;

export type ReceiveData = { action: ReceiveAction | null; data: unknown };

export type EditableElementOptions = {
	customClass?: string | undefined;
	onSaved?: ((data: Omit<SavedData, 'key'>) => void) | undefined;
};
