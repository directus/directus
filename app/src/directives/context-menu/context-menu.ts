import { Directive, DirectiveBinding } from 'vue';

function mounted(element: HTMLElement, binding: DirectiveBinding): void {
	const contextMenu = binding.instance?.$refs['contextMenu'];
	if (contextMenu) {
		element.addEventListener('contextmenu', activateContextMenu(contextMenu));
		element.addEventListener('focusout', deactivateContextMenu(contextMenu));
	} else {
		throw new Error(`[v-context-menu] Couldn't find a context menu by the ref "contextMenu".`);
	}
}

function unmounted(element: HTMLElement, binding: DirectiveBinding): void {
	const contextMenu = binding.instance?.$refs['contextMenu'];
	if (contextMenu) {
		element.removeEventListener('contextmenu', activateContextMenu(contextMenu));
		element.removeEventListener('focusout', deactivateContextMenu(contextMenu));
	}
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
		contextMenu.activate(e);
	};
}

function deactivateContextMenu(contextMenu: any) {
	return (e: Event) => {
		contextMenu?.deactivate(e);
	};
}
