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

// tokens on an edited link are treated as author-set and preserved.
const SECURITY_REL = ['noopener', 'noreferrer'];

export function useLink(editor: Ref<Editor>): UsableLink {
	const linkDrawerOpen = ref(false);
	const isEditingLink = ref(false);
	const linkSelection = ref<LinkSelection>(defaultLinkSelection());
	// the link's text when the drawer opened, so saveLink knows whether the display text changed
	const originalText = ref('');
	// the link's rel when the drawer opened, so saveLink can preserve author tokens (nofollow, etc.)
	const originalRel = ref('');

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

	// inside an existing link: prefill from its attributes; otherwise seed from the selection (URL → url field, else display text)
	function openLinkDrawer() {
		linkDrawerOpen.value = true;
		isEditingLink.value = editor.value.isActive('link');

		if (isEditingLink.value) {
			const attrs = editor.value.getAttributes('link');
			const text = linkText();
			originalText.value = text;
			originalRel.value = attrs.rel ?? '';

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
		originalRel.value = '';
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
		originalRel.value = '';
		linkDrawerOpen.value = false;
	}

	function saveLink() {
		if (!isLinkSaveable.value) return;

		const { url, displayText, title, newTab } = linkSelection.value;
		const href = url!;
		const text = displayText || href;
		const rel = buildRel(newTab);
		const attrs = { href, target: newTab ? '_blank' : null, rel, title: title || null };

		const chain = editor.value.chain().focus();
		if (isEditingLink.value) chain.extendMarkRange('link');

		// unchanged display text: re-mark the existing range (preserves nested formatting); changed: replace it
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

	// preserve author tokens (nofollow etc.); null when none remain so we don't emit an empty rel
	function buildRel(newTab: boolean): string | null {
		const authorTokens = originalRel.value.split(/\s+/).filter((token) => token && !SECURITY_REL.includes(token));
		const tokens = newTab ? [...SECURITY_REL, ...authorTokens] : authorTokens;
		return tokens.length ? tokens.join(' ') : null;
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
