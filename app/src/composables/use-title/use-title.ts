import { ref, Ref, watch } from '@vue/composition-api';
import { TranslateResult } from 'vue-i18n';

export function useTitle(newTitle: string | Ref<string>) {
	if (newTitle === undefined || newTitle === null) return;

	const titleRef = typeof newTitle === 'string' ? ref(newTitle) : newTitle;

	watch(
		titleRef,
		(title, oldTitle) => {
			if (typeof title === 'string' && oldTitle !== title) document.title = title;
		},
		{ immediate: true }
	);

	return titleRef;
}
