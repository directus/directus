import { type Editor, getMarkRange } from '@tiptap/vue-3';
import { computed, ComputedRef, Ref, ref } from 'vue';

export type LinkSelection = {
	url: string | null;
	displayText: string | null;
	title: string | null;
	newTab: boolean;
};

type UsableLink = {
	linkDrawerOpen: Ref<boolean>;
	linkSelection: Ref<LinkSelection>;
	isEditingLink: Ref<boolean>;
	isLinkSaveable: ComputedRef<boolean>;
	openLinkDrawer: () => void;
	closeLinkDrawer: () => void;
	saveLink: () => void;
	unlink: () => void;
};

const defaultLinkSelection = (): LinkSelection => ({ url: null, displayText: null, title: null, newTab: true });

export function useLink(editor: Ref<Editor>): UsableLink {
	const linkDrawerOpen = ref(false);
	const isEditingLink = ref(false);
	const linkSelection = ref<LinkSelection>(defaultLinkSelection());
	// the link's text when the drawer opened, so saveLink knows whether the display text changed
	const originalText = ref('');

	const isLinkSaveable = computed(() => Boolean(linkSelection.value.url));

	return {
		linkDrawerOpen,
		linkSelection,
		isEditingLink,
		isLinkSaveable,
		openLinkDrawer,
		closeLinkDrawer,
		saveLink,
		unlink,
	};

	// Opens the drawer; with the cursor inside an existing link, prefill from its attributes for editing.
	// Otherwise seed from the current text selection: a URL prefills the url field, anything else the display text.
	function openLinkDrawer() {
		linkDrawerOpen.value = true;
		isEditingLink.value = editor.value.isActive('link');

		if (isEditingLink.value) {
			const attrs = editor.value.getAttributes('link');
			const text = linkText();
			originalText.value = text;

			linkSelection.value = {
				url: attrs.href ?? null,
				displayText: text || null,
				title: attrs.title ?? null,
				newTab: attrs.target === '_blank',
			};

			return;
		}

		const selectedText = selectionText();
		originalText.value = selectedText;
		linkSelection.value = defaultLinkSelection();

		if (isUrl(selectedText)) {
			linkSelection.value.url = selectedText;
		} else {
			linkSelection.value.displayText = selectedText || null;
		}
	}

	function closeLinkDrawer() {
		linkSelection.value = defaultLinkSelection();
		isEditingLink.value = false;
		originalText.value = '';
		linkDrawerOpen.value = false;
	}

	function saveLink() {
		if (!isLinkSaveable.value) return;

		const { url, displayText, title, newTab } = linkSelection.value;
		const href = url!;
		const text = displayText || href;
		const attrs = { href, target: newTab ? '_blank' : null, title: title || null };

		const chain = editor.value.chain().focus();
		if (isEditingLink.value) chain.extendMarkRange('link');

		// Display text unchanged → apply the mark to the existing range (preserves nested formatting).
		// Changed (or a brand-new link with no selection) → replace the range with text carrying the mark.
		if (text === originalText.value && originalText.value !== '') {
			chain.setLink(attrs).run();
		} else {
			chain.insertContent({ type: 'text', text, marks: [{ type: 'link', attrs }] }).run();
		}

		closeLinkDrawer();
	}

	function unlink() {
		editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
		closeLinkDrawer();
	}

	// Full text of the link under the cursor, regardless of where in it the selection sits.
	function linkText(): string {
		const { state } = editor.value;
		const range = getMarkRange(state.selection.$from, state.schema.marks.link!);
		if (!range) return '';
		return state.doc.textBetween(range.from, range.to);
	}

	function selectionText(): string {
		const { from, to } = editor.value.state.selection;
		return editor.value.state.doc.textBetween(from, to);
	}

	function isUrl(value: string): boolean {
		if (!value) return false;

		try {
			new URL(value);
			return true;
		} catch {
			return false;
		}
	}
}
