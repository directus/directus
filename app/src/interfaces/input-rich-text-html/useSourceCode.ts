import { i18n } from '@/lang';
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

export default function useSourceCode(editor: Ref<any>): UsableSourceCode {
	const codeDrawerOpen = ref(false);
	const code = ref<string>();

	const sourceCodeButton = {
		icon: 'sourcecode',
		tooltip: i18n.global.t('wysiwyg_options.source_code'),
		onAction: () => {
			codeDrawerOpen.value = true;
			code.value = editor.value.getContent();
		},
	};

	return { codeDrawerOpen, code, closeCodeDrawer, saveCode, sourceCodeButton };

	function closeCodeDrawer() {
		codeDrawerOpen.value = false;
	}

	function saveCode() {
		editor.value.fire('focus');

		editor.value.setContent(code.value);
		editor.value.undoManager.add();
		closeCodeDrawer();
	}
}
