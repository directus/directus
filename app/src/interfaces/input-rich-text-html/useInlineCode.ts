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

function isInlineCode(node: Node): boolean {
	// check if node is a code node, or if it has a code node as a child
	return node.nodeName === 'CODE' || (node as Element).querySelector('code') !== null;
}

export default function useInlineCode(editor: Ref<any>): UsableInlineCode {
	let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

	const inlineCodeButton: InlineCodeButton = {
		tooltip: i18n.global.t('wysiwyg_options.codeblock'),
		icon: 'code-sample',

		onAction: () => {
			editor.value.execCommand('mceToggleFormat', false, 'code');
		},

		onSetup: (api) => {
			const updateActiveState = () => {
				const isInlineCode = editor.value.formatter.match('code');

				api.setActive(isInlineCode);
			};

			updateActiveState();

			const codeFormatChangedUnbind = editor.value.formatter.formatChanged('code', updateActiveState).unbind;

			keydownHandler = (event: KeyboardEvent) => {
				const currentNode = editor.value.selection.getNode();
				if (!isInlineCode(currentNode)) return;

				if (event.key === 'Enter') {
					event.preventDefault();

					editor.value.execCommand('removeformat');
					updateActiveState();
				}
			};

			editor.value.on('keydown', keydownHandler);

			return () => {
				if (codeFormatChangedUnbind) codeFormatChangedUnbind();
				if (keydownHandler) editor.value.off('keydown', keydownHandler);
			};
		},
	};

	return { inlineCodeButton };
}
