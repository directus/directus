import { ref, Ref, watch } from 'vue';

export function useTitle(newTitle: string | Ref<string>): Ref<string> | undefined {
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
