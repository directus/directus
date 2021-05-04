import i18n from '@/lang';
import { Ref, ref } from '@vue/composition-api';

export default function useSourceCode(editor: Ref<any>): Record<string, any> {
	const codeDrawerOpen = ref(false);
	const code = ref<string>();

	const sourceCodeButton = {
		icon: 'sourcecode',
		tooltip: i18n.t('wysiwyg_options.source_code'),
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
		editor.value.setContent(code.value);
		closeCodeDrawer();
	}
}
