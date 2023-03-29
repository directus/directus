import { cssVar } from '@directus/shared/utils/browser';

const svg = (color: string, hide: boolean) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
	<style>
		circle {
			fill: ${color};
		}
	</style>

	<circle cx="100" cy="100" r="100"/>

	${
		hide
			? ''
			: '<path d="M143.122 109.533c-.663-.167-1.216-.334-1.715-.557a3.945 3.945 0 01-1.216-.836c.332-2.952 0-5.514.276-8.411 1.106-11.253 8.132-7.688 14.439-9.526 3.928-1.114 7.855-3.398 8.851-8.078-4.315-5.069-9.128-9.526-14.383-13.314-17.094-12.255-39.444-17.157-59.747-13.76a30.762 30.762 0 0013.428 12.535s-5.502 0-10.218-3.548c-1.383.558-4.15 1.654-5.478 2.322 10.788 10.417 27.66 11.587 39.776 2.228-.055.112-1.107 1.727-2.379 8.468-2.821 14.372-10.954 13.258-21.022 9.637-20.911-7.631-32.418-.557-42.873-15.04a9.73 9.73 0 00-4.924 8.467c0 3.621 1.992 6.685 4.868 8.356 1.57-2.098 2.275-2.695 5.014-2.695-4.239 2.42-4.737 4.533-6.563 10.382-2.213 7.075-1.272 14.317-11.617 16.211-5.477.279-5.366 4.011-7.358 9.582-2.489 7.242-5.808 10.139-12.281 16.99 2.655 3.231 5.421 3.621 8.243 2.451 5.808-2.45 10.29-10.027 14.494-14.929 4.702-5.46 15.988-3.12 24.507-8.467 5.864-3.622 8.74-8.524 4.868-16.824 2.49 2.785 3.983 6.295 4.204 10.027 9.848-1.28 23.014 10.807 35.019 12.813-1.217-1.56-2.213-3.231-2.932-4.958-1.383-3.342-1.826-6.406-1.55-9.08 1.107 6.629 7.746 15.152 18.423 15.932 2.71.223 5.697-.112 8.795-1.058 3.707-1.115 7.137-2.563 11.23-1.783 3.043.557 5.864 2.117 7.635 4.735 2.655 3.9 8.464 4.735 11.064-.056-5.864-15.43-22.018-16.433-28.878-18.216z" fill="#FFF"/>'
	}
</svg>`;

export function setFavicon(color: string | null | undefined, hide = false): void {
	color = color || cssVar('--primary');

	const icon = svg(color, hide);
	const wrapper = document.createElement('div');
	wrapper.innerHTML = icon.trim();

	if (wrapper.firstChild) {
		const iconSerialized = new XMLSerializer().serializeToString(wrapper.firstChild);

		const string = 'data:image/svg+xml;base64,' + window.btoa(iconSerialized);

		const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
		link.type = 'image/x-icon';
		link.rel = 'icon';
		link.href = string;
		document.getElementsByTagName('head')[0].appendChild(link);
	}
}
