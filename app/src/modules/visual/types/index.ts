import type { AddToContextData, CheckFieldAccessData, EditConfig } from '@directus/visual-editing/types';

export type NavigationData = { url: string; title: string };

export type EditData = { key: string; editConfig: EditConfig; rect: DOMRect };

export type ReceiveData =
	| { action: 'connect'; data: null }
	| { action: 'edit'; data: EditData }
	| { action: 'navigation'; data: NavigationData }
	| { action: 'addToContext'; data: AddToContextData }
	| { action: 'checkFieldAccess'; data: CheckFieldAccessData[] }
	| { action: null; data: null };
