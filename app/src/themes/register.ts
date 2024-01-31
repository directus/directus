import type { Theme } from '@directus/themes';
import { useThemeStore } from '@directus/themes';

export const registerThemes = (themes: Theme[]) => {
	const themesStore = useThemeStore();
	themes.forEach((theme) => themesStore.registerTheme(theme));
};
