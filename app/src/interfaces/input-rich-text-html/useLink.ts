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

export default function useLink(editor: Ref<any>): UsableLink {
	const linkDrawerOpen = ref(false);
	const defaultLinkSelection = {
		url: null,
		displayText: null,
		title: null,
		newTab: true,
	};
	const linkSelection = ref<LinkSelection>(defaultLinkSelection);

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
				const overrideLinkSelection = { displayText: editor.value.selection.getContent() || null };
				setLinkSelection(overrideLinkSelection);
			}
		},
		onSetup: (buttonApi: any) => {
			const onLinkNodeSelect = (eventApi: any) => {
				buttonApi.setActive(eventApi.element.tagName === 'A');
			};

			editor.value.on('NodeChange', onLinkNodeSelect);

			return function () {
				editor.value.off('NodeChange', onLinkNodeSelect);
			};
		},
	};

	return { linkDrawerOpen, linkSelection, closeLinkDrawer, saveLink, linkButton };

	function setLinkSelection(overrideLinkSelection: Partial<LinkSelection> = {}) {
		linkSelection.value = Object.assign({}, defaultLinkSelection, overrideLinkSelection);
	}

	function closeLinkDrawer() {
		setLinkSelection();
		linkDrawerOpen.value = false;
	}

	function saveLink() {
		const link = linkSelection.value;
		if (link.url === null) return;
		const linkHtml = `<a href="${link.url}" title="${link.title || ''}" target="${link.newTab ? '_blank' : '_self'}" >${
			link.displayText || link.url
		}</a>`;

		editor.value.selection.setContent(linkHtml);
		closeLinkDrawer();
	}
}
