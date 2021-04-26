import { onBeforeMount, onBeforeUnmount, Ref } from '@vue/composition-api';

export default function unsavedChanges(isSavable: Ref<boolean>): void {
	onBeforeMount(() => {
		window.addEventListener('beforeunload', beforeUnload);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('beforeunload', beforeUnload);
	});
	function beforeUnload(event: BeforeUnloadEvent) {
		if (isSavable.value) {
			event.preventDefault();
			event.returnValue = '';
			return '';
		}
	}
}
