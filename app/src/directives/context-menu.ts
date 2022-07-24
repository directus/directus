import { Directive, DirectiveBinding } from 'vue';

function mounted(element: HTMLElement, binding: DirectiveBinding): void {
	const contextMenu = binding.instance?.$refs[binding.value];

	element.addEventListener('contextmenu', activateContextMenu(contextMenu));
	document.documentElement.addEventListener('pointerdown', deactivateContextMenu(contextMenu));
}

function unmounted(element: HTMLElement, binding: DirectiveBinding): void {
	const contextMenu = binding.instance?.$refs[binding.value];

	element.removeEventListener('contextmenu', activateContextMenu(contextMenu));
	document.documentElement.removeEventListener('pointerdown', deactivateContextMenu(contextMenu));
}

const ContextMenu: Directive = {
	mounted,
	unmounted,
};

export default ContextMenu;

function activateContextMenu(contextMenu: any) {
	return (e: Event) => {
		e.stopPropagation();
		e.preventDefault();

		if (!contextMenu) return;
		contextMenu.activate(e);
	};
}

function deactivateContextMenu(contextMenu: any) {
	return (e: Event) => {
		if (!contextMenu) return;

		const composedPath = e.composedPath() as Element[];
		if (composedPath.find((element) => element.id === contextMenu.id)) return;

		contextMenu.deactivate(e);
	};
}
