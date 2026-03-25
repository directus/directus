import { Ref } from 'vue';
import { i18n } from '@/lang';

type PreButton = {
	text: string;
	tooltip: string;
	onAction: () => void;
	onSetup: (api: { setActive: (isActive: boolean) => void }) => () => void;
};

type UsablePre = {
	preButton: PreButton;
};

function isPre(node: Node): boolean {
	return node.nodeName === 'PRE';
}

export default function usePre(editor: Ref<any>): UsablePre {
	let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

	const preButton: PreButton = {
		tooltip: i18n.global.t('wysiwyg_options.pre'),
		text: 'Pre',

		onAction: () => {
			// Remove all existing formatting before applying code formatting
			editor.value.execCommand('removeformat');
			editor.value.execCommand('mceToggleFormat', false, 'pre');
		},

		onSetup: (api) => {
			const updateActiveState = () => {
				const isPre = editor.value.formatter.match('pre');
				api.setActive(isPre);
			};

			updateActiveState();

			const preFormatUnbind = editor.value.formatter.formatChanged('pre', updateActiveState).unbind;

			keydownHandler = (event: KeyboardEvent) => {
				const currentNode = editor.value.selection.getNode();

				if (!isPre(currentNode)) return;

				if (event.key === 'Enter') {
					event.preventDefault();

					if (handleTripleEnterInPre(editor.value, currentNode)) {
						event.preventDefault();
					}
				}

				if (event.key === 'Backspace') {
					// if the current node is a pre node, and it is empty, remove it
					if (
						(isPre(currentNode) && currentNode.childNodes.length === 0) ||
						(currentNode.childNodes.length === 1 && currentNode.childNodes[0].nodeName === 'BR')
					) {
						editor.value.dom.remove(currentNode);
					}
				}
			};

			editor.value.on('keydown', keydownHandler);

			return () => {
				if (preFormatUnbind) preFormatUnbind();
				if (keydownHandler) editor.value.off('keydown', keydownHandler);
			};
		},
	};

	return { preButton };
}

function handleTripleEnterInPre(editorInstance: any, currentNode: Node): boolean {
	const preNode = editorInstance.dom.is(currentNode, 'pre')
		? currentNode
		: editorInstance.dom.getParent(currentNode, 'pre');

	if (preNode && hasTrailingBrs(preNode, 4)) {
		removeTrailingBrs(preNode, 3);
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

function removeTrailingBrs(node: Node, maxRemove: number) {
	let removedCount = 0;

	while (removedCount < maxRemove) {
		const lastChild = node.lastChild;

		if (lastChild && lastChild.nodeName === 'BR') {
			node.removeChild(lastChild);
			removedCount++;
		} else {
			break;
		}
	}
}

function insertParagraphAfter(editorInstance: any, referenceNode: Node) {
	const newParagraph = editorInstance.dom.create('p', {}, '<br>');
	editorInstance.dom.insertAfter(newParagraph, referenceNode);
	editorInstance.selection.setCursorLocation(newParagraph, 0);
	editorInstance.nodeChanged();
}
