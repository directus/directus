import capitalizeFirst from '@/utils/capitalize-first';

export default function translateShortcut(keys: string[]): string {
	const isMac = navigator.platform.toLowerCase().startsWith('mac') || navigator.platform.startsWith('iP');

	if (isMac) {
		return keys
			.map((key) => {
				if (key === 'meta') return '⌘';
				if (key === 'option') return '⌥';
				if (key === 'shift') return '⇧';
				if (key === 'alt') return '⌥';
				return capitalizeFirst(key);
			})
			.join('');
	} else {
		return keys
			.map((key) => {
				if (key === 'meta') return 'Ctrl';
				return capitalizeFirst(key);
			})
			.join('+');
	}
}
