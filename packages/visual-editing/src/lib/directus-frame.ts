import { EditableStore } from './editable-store.ts';
import type { EditableElement } from './editable-element.ts';
import type { ConfirmData, HighlightElementData, ReceiveData, SavedData, SendAction } from './types/index.ts';

/**
 * *Singleton* class to handle communication with Directus in parent frame.
 */
export class DirectusFrame {
	private static SINGLETON?: DirectusFrame;
	private static readonly ERROR_PARENT_NOT_FOUND = 'Error sending message to Directus in parent frame:';

	private origin: string | null = null;
	private confirmed = false;
	private aiEnabled = false;

	constructor() {
		if (DirectusFrame.SINGLETON) return DirectusFrame.SINGLETON;
		DirectusFrame.SINGLETON = this;

		window?.addEventListener('message', this.receive.bind(this));
	}

	isAiEnabled() {
		return this.aiEnabled;
	}

	send(action: SendAction, data?: unknown) {
		try {
			if (!this.origin) throw new Error();
			window.parent.postMessage({ action, data }, this.origin);
			return true;
		} catch (error) {
			// eslint-disable-next-line
			console.error(DirectusFrame.ERROR_PARENT_NOT_FOUND, error);
			return false;
		}
	}

	connect(origin: string) {
		this.origin = origin;
		return this.send('connect');
	}

	receive(event: MessageEvent) {
		if (!this.origin || !this.sameOrigin(event.origin, this.origin)) {
			return;
		}

		const { action, data }: ReceiveData = event.data;

		if (action === 'confirm') this.receiveConfirmAction(data);
		if (action === 'activateElements') this.receiveActivateElements(data);
		if (action === 'showEditableElements') this.receiveShowEditableElements(data);
		if (action === 'saved') this.receiveSaved(data);
		if (action === 'highlightElement') this.receiveHighlightElement(data);
	}

	receiveConfirm() {
		let attempts = 0;
		const maxAttempts = 10;
		const timeout = 100;

		return new Promise<boolean>((resolve) => {
			const checkConfirmed = () => {
				if (attempts >= maxAttempts) return resolve(false);
				attempts++;

				if (this.confirmed) resolve(true);
				else setTimeout(checkConfirmed, timeout);
			};

			checkConfirmed();
		});
	}

	private receiveConfirmAction(data: unknown) {
		this.confirmed = true;
		this.aiEnabled = !!(data as ConfirmData)?.aiEnabled;
	}

	private receiveActivateElements(data: unknown) {
		const keys: EditableElement['key'][] = Array.isArray(data) ? data : [];
		EditableStore.activateItems(keys);
	}

	private receiveShowEditableElements(data: unknown) {
		const show = !!data;
		EditableStore.highlightItems(show);
	}

	private receiveSaved(data: unknown) {
		const { key = '', collection = '', item = null, payload = {} } = data as SavedData;

		const storeItem = EditableStore.getItemByKey(key);

		if (storeItem && collection && typeof storeItem.onSaved === 'function') {
			storeItem.onSaved({ collection, item, payload });
			return;
		}

		window.location.reload();
	}

	private receiveHighlightElement(data: unknown) {
		if (!data || typeof data !== 'object') {
			EditableStore.highlightElement(null);
			return;
		}

		const { key, collection, item, fields } = data as HighlightElementData;

		if (key === null) {
			// Clear highlight (edit overlay closed or AI store emits null)
			EditableStore.highlightElement(null);
		} else if (collection && item !== undefined) {
			// Key absent, collection+item present: AI context panel hover
			// Looks up via getItemByEditConfig(). fields included for relational/multi-field items
			EditableStore.highlightElement(fields ? { collection, item, fields } : { collection, item });
		} else if (typeof key === 'string') {
			// Key of type string = UUID from editable-element.ts, looks up via getItemByKey()
			EditableStore.highlightElement({ key });
		}
	}

	private sameOrigin(origin: string, url: string) {
		try {
			return origin === new URL(url).origin;
		} catch {
			return false;
		}
	}
}
