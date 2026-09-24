import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { useLink } from './use-link';

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function setup(content = '<p></p>') {
	const editor = shallowRef(new Editor({ extensions: editorExtensions, content }));
	editors.push(editor.value);
	const usable = useLink(editor);
	return { editor, ...usable };
}

test('openLinkDrawer with no active link leaves the selection empty and not editing', () => {
	const { linkDrawerOpen, linkSelection, isEditingLink, openLinkDrawer } = setup('<p>text</p>');

	openLinkDrawer();

	expect(linkDrawerOpen.value).toBe(true);
	expect(isEditingLink.value).toBe(false);
	expect(linkSelection.value.url).toBeNull();
	expect(linkSelection.value.displayText).toBeNull();
});

test('openLinkDrawer prefills url/title/newTab/displayText from the link under the cursor', () => {
	const { editor, linkSelection, isEditingLink, openLinkDrawer } = setup(
		'<p><a href="https://directus.io" title="My title" target="_blank">hello</a></p>',
	);

	editor.value.commands.setTextSelection(3);

	openLinkDrawer();

	expect(isEditingLink.value).toBe(true);

	expect(linkSelection.value).toMatchObject({
		url: 'https://directus.io',
		title: 'My title',
		displayText: 'hello',
		newTab: true,
	});
});

test('openLinkDrawer detects a same-tab link (no target) as newTab false', () => {
	const { editor, linkSelection, openLinkDrawer } = setup('<p><a href="https://directus.io">hello</a></p>');

	editor.value.commands.setTextSelection(3);

	openLinkDrawer();

	expect(linkSelection.value.newTab).toBe(false);
});

test('openLinkDrawer prefills the url when the plain-text selection is a URL', () => {
	const { editor, linkSelection, openLinkDrawer } = setup('<p>https://directus.io</p>');

	editor.value.commands.setTextSelection({ from: 1, to: 20 });

	openLinkDrawer();

	expect(linkSelection.value.url).toBe('https://directus.io');
});

test('openLinkDrawer prefills the display text when the plain-text selection is not a URL', () => {
	const { editor, linkSelection, openLinkDrawer } = setup('<p>just words</p>');

	editor.value.commands.setTextSelection({ from: 1, to: 11 });

	openLinkDrawer();

	expect(linkSelection.value.url).toBeNull();
	expect(linkSelection.value.displayText).toBe('just words');
});

test('saveLink inserts an anchor with href, title and target when creating a new link', () => {
	const { editor, linkSelection, saveLink } = setup('<p></p>');

	linkSelection.value = { url: 'https://directus.io', displayText: 'Directus', title: 'Home', newTab: true };

	saveLink();

	const html = editor.value.getHTML();
	expect(html).toContain('href="https://directus.io"');
	expect(html).toContain('title="Home"');
	expect(html).toContain('target="_blank"');
	expect(html).toContain('rel="noopener noreferrer"');
	expect(html).toContain('>Directus</a>');
});

test('saveLink falls back to the url as display text when display text is empty', () => {
	const { editor, linkSelection, saveLink } = setup('<p></p>');

	linkSelection.value = { url: 'https://directus.io', displayText: null, title: null, newTab: false };

	saveLink();

	expect(editor.value.getHTML()).toContain('>https://directus.io</a>');
});

test('saveLink omits target when newTab is false', () => {
	const { editor, linkSelection, saveLink } = setup('<p></p>');

	linkSelection.value = { url: 'https://directus.io', displayText: 'Directus', title: null, newTab: false };

	saveLink();

	const html = editor.value.getHTML();
	expect(html).not.toContain('target=');
	expect(html).not.toContain('rel=');
});

test('saveLink updates the display text of an existing link', () => {
	const { editor, linkSelection, isEditingLink, openLinkDrawer, saveLink } = setup(
		'<p><a href="https://directus.io">old</a></p>',
	);

	editor.value.commands.setTextSelection(3);
	openLinkDrawer();
	expect(isEditingLink.value).toBe(true);

	linkSelection.value = { ...linkSelection.value, displayText: 'new', url: 'https://directus.io/new' };

	saveLink();

	const html = editor.value.getHTML();
	expect(html).toContain('href="https://directus.io/new"');
	expect(html).toContain('>new</a>');
	expect(html).not.toContain('old');
});

test('saveLink preserves author rel tokens while keeping noopener/noreferrer for a new-tab link', () => {
	const { editor, linkSelection, openLinkDrawer, saveLink } = setup(
		'<p><a href="https://directus.io" target="_blank" rel="noopener noreferrer nofollow">hello</a></p>',
	);

	editor.value.commands.setTextSelection(3);
	openLinkDrawer();

	// edit only the title, leave new-tab on
	linkSelection.value = { ...linkSelection.value, title: 'Home' };

	saveLink();

	expect(editor.value.getHTML()).toContain('rel="noopener noreferrer nofollow"');
});

test('saveLink keeps author rel tokens but drops noopener/noreferrer when switching to same-tab', () => {
	const { editor, linkSelection, openLinkDrawer, saveLink } = setup(
		'<p><a href="https://directus.io" target="_blank" rel="noopener noreferrer nofollow">hello</a></p>',
	);

	editor.value.commands.setTextSelection(3);
	openLinkDrawer();

	linkSelection.value = { ...linkSelection.value, newTab: false };

	saveLink();

	const html = editor.value.getHTML();
	expect(html).toContain('rel="nofollow"');
	expect(html).not.toContain('noopener');
	expect(html).not.toContain('target=');
});

test('saveLink does nothing when the url is empty', () => {
	const { editor, linkSelection, saveLink } = setup('<p>text</p>');

	linkSelection.value = { url: null, displayText: 'x', title: null, newTab: true };

	saveLink();

	expect(editor.value.getHTML()).not.toContain('<a');
});

test('unlink removes the link mark from the link under the cursor', () => {
	const { editor, openLinkDrawer, unlink } = setup('<p><a href="https://directus.io">hello</a></p>');

	editor.value.commands.setTextSelection(3);
	openLinkDrawer();

	unlink();

	const html = editor.value.getHTML();
	expect(html).not.toContain('<a');
	expect(html).toContain('hello');
});

// image links live on the image node (extensions/image.ts), not on the Link mark
describe('image link', () => {
	const IMAGE = '<img src="/assets/abc" alt="a">';
	const LINKED_IMAGE = `<a href="https://directus.io" target="_blank" rel="noopener noreferrer nofollow">${IMAGE}</a>`;
	// a block after the image keeps StarterKit's trailing-node paragraph out of the expected HTML
	const AFTER = '<p>y</p>';

	function selectImage(editor: Editor) {
		let imagePos = -1;

		editor.state.doc.descendants((node, pos) => {
			if (node.type.name === 'image') imagePos = pos;
		});

		editor.commands.setNodeSelection(imagePos);
	}

	test('openLinkDrawer on an unlinked image is image mode, not editing, with an empty url', () => {
		const { editor, isImageLink, isEditingLink, linkSelection, openLinkDrawer } = setup(`<p>x</p>${IMAGE}`);
		selectImage(editor.value);

		openLinkDrawer();

		expect(isImageLink.value).toBe(true);
		expect(isEditingLink.value).toBe(false);
		expect(linkSelection.value.url).toBeNull();
		expect(linkSelection.value.displayText).toBeNull();
	});

	test('openLinkDrawer on a text link is not image mode', () => {
		const { editor, isImageLink, openLinkDrawer } = setup('<p><a href="https://directus.io">hello</a></p>');
		editor.value.commands.setTextSelection(3);

		openLinkDrawer();

		expect(isImageLink.value).toBe(false);
	});

	test('openLinkDrawer on a linked image prefills url, title and newTab and is editing', () => {
		const { editor, isImageLink, isEditingLink, linkSelection, openLinkDrawer } = setup(
			`<a href="https://directus.io" target="_blank"><img src="/assets/abc" alt="a" title="Home"></a>`,
		);

		selectImage(editor.value);

		openLinkDrawer();

		expect(isImageLink.value).toBe(true);
		expect(isEditingLink.value).toBe(true);
		expect(linkSelection.value).toMatchObject({ url: 'https://directus.io', title: 'Home', newTab: true });
	});

	test('saveLink wraps the selected image in an anchor instead of inserting text', () => {
		const { editor, linkSelection, openLinkDrawer, saveLink } = setup(`<p>x</p>${IMAGE}${AFTER}`);
		selectImage(editor.value);
		openLinkDrawer();

		linkSelection.value = { ...linkSelection.value, url: 'https://directus.io', title: 'Home', newTab: true };

		saveLink();

		expect(editor.value.getHTML()).toBe(
			`<p>x</p><a href="https://directus.io" target="_blank" rel="noopener noreferrer"><img title="Home" src="/assets/abc" alt="a"></a>${AFTER}`,
		);
	});

	test('saveLink on an image omits target and rel when newTab is false', () => {
		const { editor, linkSelection, openLinkDrawer, saveLink } = setup(`${IMAGE}${AFTER}`);
		selectImage(editor.value);
		openLinkDrawer();

		linkSelection.value = { ...linkSelection.value, url: 'https://directus.io', newTab: false };

		saveLink();

		expect(editor.value.getHTML()).toBe(`<a href="https://directus.io">${IMAGE}</a>${AFTER}`);
	});

	test('saveLink on a linked image keeps author rel tokens and its preserved attributes', () => {
		const { editor, linkSelection, openLinkDrawer, saveLink } = setup(
			`<a href="https://directus.io" target="_blank" rel="noopener noreferrer nofollow"><img class="hero" src="/assets/abc" alt="a"></a>${AFTER}`,
		);

		selectImage(editor.value);
		openLinkDrawer();

		linkSelection.value = { ...linkSelection.value, url: 'https://directus.io/new' };

		saveLink();

		expect(editor.value.getHTML()).toBe(
			`<a href="https://directus.io/new" target="_blank" rel="noopener noreferrer nofollow"><img class="hero" src="/assets/abc" alt="a"></a>${AFTER}`,
		);
	});

	test('saveLink on an image refuses a script href', () => {
		const { editor, linkSelection, openLinkDrawer, saveLink } = setup(`${IMAGE}${AFTER}`);
		selectImage(editor.value);
		openLinkDrawer();

		linkSelection.value = { ...linkSelection.value, url: 'javascript:alert(1)' };

		saveLink();

		expect(editor.value.getHTML()).toBe(`${IMAGE}${AFTER}`);
	});

	test('unlink on a linked image drops the anchor and keeps the image', () => {
		const { editor, openLinkDrawer, unlink } = setup(`${LINKED_IMAGE}${AFTER}`);
		selectImage(editor.value);
		openLinkDrawer();

		unlink();

		expect(editor.value.getHTML()).toBe(`${IMAGE}${AFTER}`);
	});

	test('closeLinkDrawer resets image mode', () => {
		const { editor, isImageLink, openLinkDrawer, closeLinkDrawer } = setup(IMAGE);
		selectImage(editor.value);
		openLinkDrawer();

		closeLinkDrawer();

		expect(isImageLink.value).toBe(false);
	});
});

test('isLinkSaveable reflects whether a url is present', () => {
	const { linkSelection, isLinkSaveable } = setup();

	expect(isLinkSaveable.value).toBe(false);

	linkSelection.value = { url: 'https://directus.io', displayText: null, title: null, newTab: true };
	expect(isLinkSaveable.value).toBe(true);
});
