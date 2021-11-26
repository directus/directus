import { i18n } from '@/lang';
import { Ref, ref } from 'vue';

type LinkSelection = {
	url: string | null;
	displayText: string | null;
	title: string | null;
	newTab: boolean;
};

type LinkButton = {
	icon: string;
	tooltip: string;
	onAction: (buttonApi: any) => void;
	onSetup: (buttonApi: any) => () => void;
};

type UsableLink = {
	linkDrawerOpen: Ref<boolean>;
	linkSelection: Ref<LinkSelection>;
	closeLinkDrawer: () => void;
	saveLink: () => void;
	linkButton: LinkButton;
};

export default function useLink(editor: Ref<any>, isEditorDirty: Ref<boolean>): UsableLink {
	const linkDrawerOpen = ref(false);
	const linkSelection = ref<LinkSelection>({
		url: null,
		displayText: null,
		title: null,
		newTab: true,
	});

	const linkButton = {
		icon: 'link',
		tooltip: i18n.global.t('wysiwyg_options.link'),
		onAction: (buttonApi: any) => {
			linkDrawerOpen.value = true;

			if (buttonApi.isActive()) {
				const node = editor.value.selection.getNode() as HTMLLinkElement;
				editor.value.selection.select(node);

				const url = node.getAttribute('href');
				const title = node.getAttribute('title');
				const displayText = node.innerText;
				const target = node.getAttribute('target');

				if (url === null || displayText === null) {
					return;
				}

				linkSelection.value = {
					url,
					displayText,
					title: title || null,
					newTab: target === '_blank',
				};
			} else {
				defaultLinkSelection();
			}
		},
		onSetup: (buttonApi: any) => {
			const onImageNodeSelect = (eventApi: any) => {
				buttonApi.setActive(eventApi.element.tagName === 'A');
			};

			editor.value.on('NodeChange', onImageNodeSelect);

			return function () {
				editor.value.off('NodeChange', onImageNodeSelect);
			};
		},
	};

	return { linkDrawerOpen, linkSelection, closeLinkDrawer, saveLink, linkButton };

	function defaultLinkSelection() {
		linkSelection.value = {
			url: null,
			displayText: null,
			title: null,
			newTab: true,
		};
	}

	function closeLinkDrawer() {
		defaultLinkSelection();
		linkDrawerOpen.value = false;
	}

	function saveLink() {
		const link = linkSelection.value;
		if (link.url === null) return;
		const linkHtml = `<a href="${link.url}" title="${link.title || ''}" target="${link.newTab ? '_blank' : '_self'}" >${
			link.displayText || link.url
		}</a>`;

		isEditorDirty.value = true;
		editor.value.selection.setContent(linkHtml);
		closeLinkDrawer();
	}
}
