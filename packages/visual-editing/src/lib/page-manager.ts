export class PageManager {
	private static navigationInitialized = false;

	static onNavigation(callback: (data: { url: string; title: string }) => void) {
		if (PageManager.navigationInitialized) return;

		let lastUrl = '';
		let lastTitle = '';
		let debounceId: number;

		const debounce = (debounceFunction: () => void) => {
			clearTimeout(debounceId);
			debounceId = setTimeout(debounceFunction, 100);
		};

		const observeNavigation = () => {
			const url = window.location.href;
			const title = document.title;
			const changesDetected = lastUrl !== url || lastTitle !== title;

			if (changesDetected) {
				debounce(() => callback({ url, title }));
				lastUrl = url;
				lastTitle = title;
			}

			setTimeout(observeNavigation, changesDetected ? 50 : 200);
		};

		observeNavigation();

		PageManager.navigationInitialized = true;
	}
}
