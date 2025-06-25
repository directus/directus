import { i18n } from '@/lang';
import { Ref } from 'vue';

type InlineCodeButton = {
	icon: string;
	tooltip: string;
	onAction: () => void;
	onSetup: (api: { setActive: (isActive: boolean) => void }) => () => void;
};

type UsableInlineCode = {
	inlineCodeButton: InlineCodeButton;
};

export default function useInlineCode(editor: Ref<any>): UsableInlineCode {
	let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

	const inlineCodeButton: InlineCodeButton = {
		tooltip: i18n.global.t('wysiwyg_options.codeblock'),
		icon: 'sourcecode',

		onAction: () => {
			const selectionContent = editor.value.selection.getContent({ format: 'text' });
			const selectedText = selectionContent.split('\n');

			editor.value.execCommand(
				'mceToggleFormat',
				false,
				selectedText.length === 1 ? 'code' : 'pre'
			);
		},

		onSetup: (api) => {
			const updateActiveState = () => {
				const isInlineCode = editor.value.formatter.match('code');
				const isCodeBlock = editor.value.formatter.match('pre');
				api.setActive(isInlineCode || isCodeBlock);
			};

			updateActiveState();

			const formatChangedUnbind = editor.value.formatter.formatChanged('code', updateActiveState).unbind;
			let activeNodeBeforeEnter: Node | null = null;

			keydownHandler = (event: KeyboardEvent) => {
				const editorInstance = editor.value;

				if (event.key === 'Enter') {
					const currentNode = editorInstance.selection.getNode();

					// Handle each case separately
					if (handleTripleEnterInPre(editorInstance, currentNode)) {
						event.preventDefault();
						activeNodeBeforeEnter = null;
						return false;
					}

					const nodeToCheck = activeNodeBeforeEnter || currentNode;

					if (handleEmptyInlineCode(editorInstance, nodeToCheck)) {
						event.preventDefault();
						activeNodeBeforeEnter = null;
						return false;
					}

					if (handleEnterInInlineCode(editorInstance, activeNodeBeforeEnter)) {
						event.preventDefault();
						activeNodeBeforeEnter = null;
						return false;
					}
				} else {
					activeNodeBeforeEnter = editor.value.selection.getNode();
				}
			};

			editor.value.on('keydown', keydownHandler);

			return () => {
				if (formatChangedUnbind) formatChangedUnbind();
				if (keydownHandler) editor.value.off('keydown', keydownHandler);
			};
		},
	};

	return { inlineCodeButton };
}

function handleEnterInInlineCode(editorInstance: any, activeNodeBeforeEnter: Node | null): boolean {
	const codeNode = editorInstance.dom.getParent(activeNodeBeforeEnter, 'code');
	const codeNodeParent = editorInstance.dom.getParent(codeNode, 'p');

	if (codeNode) {
		handleInlineCodeEnter(editorInstance, codeNode, codeNodeParent);
		return true;
	}

	return false;
}

function handleInlineCodeEnter(editorInstance: any, codeNode: Node, codeNodeParent: Node | null) {
	const content = codeNode.textContent || '';
	const blockParent = editorInstance.dom.getParent(codeNode, editorInstance.dom.isBlock);

	let hasTextBeforeCode = false;

	if (blockParent) {
		for (const child of blockParent.childNodes) {
			if (child === codeNode) break;

			if (child.nodeType === Node.TEXT_NODE && child.textContent) {
				hasTextBeforeCode = true;
				break;
			}
		}
	}

	if (hasTextBeforeCode) {
		editorInstance.insertContent('<p><br></p>');
	} else {
		editorInstance.dom.remove(codeNode);
		if (codeNodeParent) editorInstance.dom.remove(codeNodeParent);
		const newContent = editorInstance.dom.encode(content) + '<br><br>';
		editorInstance.insertContent(`<pre>${newContent}</pre>`);
	}

	editorInstance.nodeChanged();
}

function handleTripleEnterInPre(editorInstance: any, currentNode: Node): boolean {
	const preNode = editorInstance.dom.is(currentNode, 'pre')
		? currentNode
		: editorInstance.dom.getParent(currentNode, 'pre');

	if (preNode && hasTrailingBrs(preNode, 3)) {
		removeLastBr(preNode);
		insertParagraphAfter(editorInstance, preNode);
		return true;
	}

	return false;
}

function hasTrailingBrs(node: Node, count: number): boolean {
	const childNodes = Array.from(node.childNodes);
	let trailingBrCount = 0;

	for (let i = childNodes.length - 1; i >= 0; i--) {
		const child = childNodes[i];
		if (!child) break;

		if (child.nodeName === 'BR') {
			trailingBrCount++;
		} else if (child.nodeType === Node.TEXT_NODE && child.textContent === '') {
			continue;
		} else {
			break;
		}
	}

	return trailingBrCount >= count;
}

function removeLastBr(node: Node) {
	const lastChild = node.lastChild;

	if (lastChild && lastChild.nodeName === 'BR') {
		node.removeChild(lastChild);
	}
}

function insertParagraphAfter(editorInstance: any, referenceNode: Node) {
	const newParagraph = editorInstance.dom.create('p', {}, '<br>');
	editorInstance.dom.insertAfter(newParagraph, referenceNode);
	editorInstance.selection.setCursorLocation(newParagraph, 0);
	editorInstance.nodeChanged();
}

function handleEmptyInlineCode(editorInstance: any, nodeToCheck: Node): boolean {
	const inlineCodeNode = findInlineCodeNode(editorInstance, nodeToCheck);

	if (inlineCodeNode && (inlineCodeNode.textContent || '').trim() === '') {
		removeEmptyInlineCode(editorInstance, inlineCodeNode);
		return true;
	}

	return false;
}

function findInlineCodeNode(editorInstance: any, node: Node): Node | null {
	if (editorInstance.dom.is(node, 'code')) return node;

	if (node.querySelector) {
		const found = node.querySelector('code');
		if (found) return found;
	}

	return editorInstance.dom.getParent(node, 'code');
}

function removeEmptyInlineCode(editorInstance: any, inlineCodeNode: Node) {
	editorInstance.dom.remove(inlineCodeNode);

	// Insert two empty paragraphs to break out of inline code
	editorInstance.execCommand('mceInsertContent', false, '<p>&nbsp;</p>');

	editorInstance.focus();

	// Set cursor to the last inserted paragraph
	const body = editorInstance.getBody();
	const paragraphs = body.querySelectorAll('p');

	if (paragraphs.length > 0) {
		const lastParagraph = paragraphs[paragraphs.length - 1];
		editorInstance.selection.setCursorLocation(lastParagraph, 0);
	}

	editorInstance.nodeChanged();
}
