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
	const inlineCodeButton = {
		tooltip: i18n.global.t('wysiwyg_options.codeblock'),
		icon: 'sourcecode',
		onAction: function () {
			const selectionContent = editor.value.selection.getContent({ format: 'text' });
			const selectedText = selectionContent.split('\n');

			if (selectedText.length === 1) {
				// Single line of text selected
				editor.value.execCommand('mceToggleFormat', false, 'code');
			} else {
				// Multiple lines of text selected
				editor.value.execCommand('mceToggleFormat', false, 'pre');
			}
		},
		onSetup: function (api: { setActive: (arg0: any) => void }) {
			api.setActive(editor.value.formatter.match('code'));
			api.setActive(editor.value.formatter.match('pre'));
			const unbind = editor.value.formatter.formatChanged('code', api.setActive).unbind;

			return function () {
				if (unbind) unbind();
			};
		},
	};

	return { inlineCodeButton };
}
