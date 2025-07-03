import { i18n } from '@/lang';
import { Ref } from 'vue';

type PreButton = {
	icon: string;
	tooltip: string;
	onAction: () => void;
	onSetup: (api: { setActive: (isActive: boolean) => void }) => () => void;
};

type UsablePre = {
	preButton: PreButton;
};

export default function usePre(editor: Ref<any>): UsablePre {
	let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

	const preButton: PreButton = {
		tooltip: 'Pre',
		icon: 'customPre',

		onAction: () => {
			const selectionContent = editor.value.selection.getContent({ format: 'text' });
			const selectedText = selectionContent.split('\n');

			// Remove all existing formatting before applying code formatting
			editor.value.execCommand('removeformat');

			// Apply code formatting based on content
			if (selectedText.length === 1) {
				// Single line - use inline code
				editor.value.execCommand('mceToggleFormat', false, 'code');
			} else {
				// Multiple lines - wrap in pre tag
				editor.value.execCommand('mceToggleFormat', false, 'pre');
			}
		},

		onSetup: (api) => {
			const updateActiveState = () => {
				const isPre = editor.value.formatter.match('code');
				const isCodeBlock = editor.value.formatter.match('pre');

				api.setActive(isPre || isCodeBlock);
			};

			updateActiveState();

			const codeFormatChangedUnbind = editor.value.formatter.formatChanged('code', updateActiveState).unbind;
			const preFormatUnbind = editor.value.formatter.formatChanged('pre', updateActiveState).unbind;
			let activeNodeBeforeEnter: Node | null = null;

			keydownHandler = (event: KeyboardEvent) => {
				const editorInstance = editor.value;

				if (event.key === 'Enter') {
					const currentNode = editorInstance.selection.getNode();

					if (handleTripleEnterInPre(editorInstance, currentNode)) {
						event.preventDefault();
						activeNodeBeforeEnter = null;
					}

					const nodeToCheck = activeNodeBeforeEnter || currentNode;

					if (handleEmptyPre(editorInstance, nodeToCheck)) {
						event.preventDefault();
						activeNodeBeforeEnter = null;
					}

					if (handleEnterInPre(editorInstance, activeNodeBeforeEnter)) {
						event.preventDefault();
						activeNodeBeforeEnter = null;
					}
				} else if (event.key === 'Backspace') {
					const editorInstance = editor.value;
					const currentNode = editorInstance.selection.getNode();
					const preCodeNode = editorInstance.dom.getParent(currentNode, 'pre');
					const codeNode = editorInstance.dom.getParent(currentNode, 'code');

					// Handle pre tag conversion to code tag
					if (preCodeNode) {
						const convertToInlineStyle = shouldConvertToInlineStyle(preCodeNode);

						if (convertToInlineStyle) {
							const preContent = preCodeNode.textContent || '';
							const trimmedContent = preContent.trim();

							// Create the code element
							const codeElement = editorInstance.dom.create('code', {}, editorInstance.dom.encode(trimmedContent));

							// Replace the pre block with the code element
							editorInstance.dom.replace(codeElement, preCodeNode);

							// Set cursor inside the code element
							editorInstance.selection.setCursorLocation(codeElement, 0);

							editorInstance.nodeChanged();

							activeNodeBeforeEnter = codeElement;

							// Prevent the default backspace behavior
							event.preventDefault();
							return;
						}
					}

					if (codeNode && (codeNode.textContent || '').trim() === '') {
						editorInstance.dom.remove(codeNode);
					}
				} else {
					activeNodeBeforeEnter = editor.value.selection.getNode();
				}
			};

			editor.value.on('keydown', keydownHandler);

			return () => {
				if (codeFormatChangedUnbind) codeFormatChangedUnbind();
				if (preFormatUnbind) preFormatUnbind();
				if (keydownHandler) editor.value.off('keydown', keydownHandler);
			};
		},
	};

	return { preButton };
}

function shouldConvertToInlineStyle(preNode: Node): boolean {
	const childNodes = Array.from(preNode.childNodes);
	let hasText = false;
	let foundBr = false;

	for (let i = 0; i < childNodes.length; i++) {
		const child = childNodes[i];

		if (child && child.nodeType === Node.TEXT_NODE) {
			// Skip empty text nodes
			if (child.textContent && child.textContent.trim() !== '') {
				hasText = true;

				// If we already found a BR, no more text is allowed
				if (foundBr) {
					return false;
				}
			}
		} else if (child && child.nodeType === Node.ELEMENT_NODE) {
			// Allow a single br tag, so long as it's after the text
			if (child.nodeName === 'BR') {
				if (hasText && !foundBr) {
					// First BR after text is okay
					foundBr = true;
				} else {
					// Either BR before text, or second BR - not allowed
					return false;
				}
			} else {
				// Any other element is not allowed
				return false;
			}
		}
	}

	return hasText; // Must have at least some text content
}

function handleEnterInPre(editorInstance: any, activeNodeBeforeEnter: Node | null): boolean {
	const codeNode = editorInstance.dom.getParent(activeNodeBeforeEnter, 'code');
	const codeNodeParent = editorInstance.dom.getParent(codeNode, 'p');

	if (codeNode) {
		handlePreEnter(editorInstance, codeNode, codeNodeParent);
		return true;
	}

	return false;
}

function handlePreEnter(editorInstance: any, codeNode: Node, codeNodeParent: Node | null) {
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

function handleEmptyPre(editorInstance: any, nodeToCheck: Element): boolean {
	const preNode = findPreNode(editorInstance, nodeToCheck);

	if (preNode && (preNode.textContent || '').trim() === '') {
		removeEmptyPre(editorInstance, preNode);
		return true;
	}

	return false;
}

function findPreNode(editorInstance: any, node: Element): Node | null {
	if (editorInstance.dom.is(node, 'code')) return node;

	if (node.querySelector) {
		const found = node.querySelector('code');
		if (found) return found;
	}

	return editorInstance.dom.getParent(node, 'code');
}

function removeEmptyPre(editorInstance: any, preNode: Node) {
	editorInstance.dom.remove(preNode);

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
