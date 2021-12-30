import { Directive, DirectiveBinding } from 'vue';

function mounted(element: HTMLElement, binding: DirectiveBinding): void {
	const contextMenu = binding.instance?.$refs[binding.value];

	element.addEventListener('contextmenu', activateContextMenu(contextMenu));
	element.addEventListener('focusout', deactivateContextMenu(contextMenu));
}

function unmounted(element: HTMLElement, binding: DirectiveBinding): void {
	const contextMenu = binding.instance?.$refs[binding.value];

	element.removeEventListener('contextmenu', activateContextMenu(contextMenu));
	element.removeEventListener('focusout', deactivateContextMenu(contextMenu));
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

		if (contextMenu) contextMenu.activate(e);
	};
}

function deactivateContextMenu(contextMenu: any) {
	return (e: Event) => {
		if (contextMenu) contextMenu.deactivate(e);
	};
}
