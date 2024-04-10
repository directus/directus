import { i18n } from '@/lang';
import { Editor as TinyMCE } from 'tinymce';
import { Ref, ref } from 'vue';

type SourceCodeButton = {
	icon: string;
	tooltip: string;
	onAction: () => void;
};

type UsableSourceCode = {
	codeDrawerOpen: Ref<boolean>;
	code: Ref<string | undefined>;
	closeCodeDrawer: () => void;
	saveCode: () => void;
	sourceCodeButton: SourceCodeButton;
};

export function useSourceCode(editor: Ref<TinyMCE | undefined>): UsableSourceCode {
	const codeDrawerOpen = ref(false);
	const code = ref<string>();

	const sourceCodeButton = {
		icon: 'sourcecode',
		tooltip: i18n.global.t('wysiwyg_options.source_code'),
		onAction: () => {
			if (!editor.value) return;

			codeDrawerOpen.value = true;
			code.value = editor.value.getContent();
		},
	};

	return { codeDrawerOpen, code, closeCodeDrawer, saveCode, sourceCodeButton };

	function closeCodeDrawer() {
		codeDrawerOpen.value = false;
		editor.value?.focus();
	}

	function saveCode() {
		if (!editor.value) {
			closeCodeDrawer();
			return;
		}

		editor.value.setContent(code.value || '');
		editor.value.undoManager.add();
		closeCodeDrawer();
	}
}
