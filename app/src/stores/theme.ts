/* eslint-disable no-console */
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { defineStore } from 'pinia';
import { notify } from '@/utils/notify';
import { i18n } from '@/lang';
import { RawField, Theme, User } from '@directus/shared/types';
import { baseLight, baseDark, themeEditorFields } from '@/themes';
import {
	resolveThemeVariables,
	resolveFieldValues,
	resolveFontLink,
	extractFontsFromTheme,
	applyThemeOverrides,
} from '@/utils/theming';
import { useUserStore } from '@/stores';
import { unflatten } from 'flat';
import { merge } from 'lodash';
import { deepDiff } from '@/utils/deep-diff-object';

type ThemeVariants = 'dark' | 'light' | string;
type ThemeBase = Record<ThemeVariants, Theme>;
type ThemeOverrides = Record<ThemeVariants, Theme['theme']>;

export const SYSTEM_THEME_STYLE_TAG_ID = 'system-themes';
export const THEME_FONTS_STYLE_TAG_ID = 'theme-fonts';

const availableThemes = ['light', 'dark'];

// This assumes that the internal light and dark theme have the same font set.
// If that ever changes, this will need to be modified.
const internalFonts = extractFontsFromTheme(baseLight.theme);

export const useThemeStore = defineStore({
	id: 'themesStore',
	state: () => ({
		themeBase: {} as ThemeBase,
		/** For now, the theme overrides don't need to define the entire theme. Only the alterations. */
		themeOverrides: {} as ThemeOverrides,
		/**
		 * Default to light theme -
		 * This is entirely separate from the active theme in the app (retrieved from the users store).
		 * We use this property to keep track of the theme currently being edited in theme editor.
		 */
		editingTheme: 'light',
		// Keep track of the fonts we need to load from Google Fonts
		externalFonts: [] as string[],
	}),
	getters: {
		/**
		 * Getter returns function -
		 * Usage: getThemeCSS( 'dark' | 'light' )
		 */
		getThemeCSS() {
			return (mode: ThemeVariants = 'light'): string => {
				let themeVariables = '';
				themeVariables = resolveThemeVariables(this.getMergedTheme(mode));

				/**
				 * You'll notice we add a couple tabs to the line breaks in the
				 * themeVariables string. This is purely cosmetic. The indentation
				 * is a little weird in the page source if we don't do this.
				 */
				const resolvedThemeCSS = `\n\n\
.theme-${mode}, body.${mode} {
	${themeVariables.replace(/\n/g, '\n\t')}
}

@media (prefers-color-scheme: ${mode}) {
	body.auto {
		${themeVariables.replace(/\n/g, '\n\t\t')}
	}
}`;

				return resolvedThemeCSS;
			};
		},
		getMergedTheme: (state) => {
			return (mode: ThemeVariants = 'light') => {
				/**
				 * Base themes store entire theme/metadata (title, desc., etc.). When
				 * targeting `themeBase` we have to get the `theme` sub-property
				 */
				const mergedTheme = applyThemeOverrides(state.themeBase[mode].theme, state.themeOverrides[mode]);
				return mergedTheme;
			};
		},
		getCurrentMergedTheme(): Record<string, any> {
			/**
			 * NOTE: This getter works exactly the same as `getMergedTheme`, except you can't
			 * pass a theme mode, it automatically gets the theme currently being edited.
			 *
			 * Why do this? This is necessary because getters can only receive parameters by
			 * returning a function, however, this breaks the caching functionality of
			 * Pinia's getters (getters normally return computed properties, which are
			 * automatically cached by vue).
			 *
			 * `getCurrentMergedTheme` is called very frequently in the usage of
			 * `getInitialValues`. As a result, we would take a performance hit if we instead
			 * used `getMergedTheme`, ignoring any cache.
			 */
			const mergedTheme = applyThemeOverrides(
				this.themeBase[this.editingTheme].theme,
				this.themeOverrides[this.editingTheme]
			);
			return mergedTheme;
		},
		getInitialValues(): Record<string, any> {
			return resolveFieldValues(this.getCurrentMergedTheme || {});
		},
		getDefaultValues(): Record<string, any> {
			return resolveFieldValues(this.themeBase[this.editingTheme].theme) || {};
		},
		getFields() {
			/**
			 * Defaults are dependent on theme mode/base theme. As a result, we can't populate them
			 * on field generation. We'll populate defaults here, now that we know the mode.
			 */
			const defaultValues = this.getDefaultValues;
			const fieldsWithDefaults = themeEditorFields.map((field: Partial<RawField>) => {
				if (field.schema && field.field) {
					field.schema.default_value = defaultValues[field.field] || '';
				}
				// Ensure meta.field is populated to avoid errors in v-form
				if (field.meta && field.field && !field.meta.field) {
					field.meta.field = field.field;
				}

				return field;
			});
			return fieldsWithDefaults;
		},
	},
	actions: {
		/**
		 * Store only stores info from public '/server/info' endpoint. We want themes/styles to
		 * persist when logged out so once we hydrate there's no need to dehydrate.
		 */
		async hydrate() {
			/** Pull in base themes first */
			this.themeBase.dark = baseDark || {};
			this.themeBase.light = baseLight || {};

			/** Get server info to pull overrides */
			const serverInfo = await api.get(`/server/info`, { params: { limit: -1 } });
			const overrides: ThemeOverrides = serverInfo.data.data.project['theme_overrides'] || {};

			this.themeOverrides.dark = overrides.dark || {};
			this.themeOverrides.light = overrides.light || {};

			this.externalFonts = extractFontsFromTheme(this.themeOverrides, internalFonts);
		},
		/**
		 * Writes CSS variables to DOM style tag
		 */
		async populateStyles() {
			const styleTag: HTMLStyleElement | null = document.querySelector(`style#${SYSTEM_THEME_STYLE_TAG_ID}`);
			if (!styleTag) {
				return console.error(`Style tag with ID ${SYSTEM_THEME_STYLE_TAG_ID} does not exist in document`);
			}

			// Set CSS variables
			const lightThemeStyle = this.getThemeCSS('light') || '';
			const darkThemeStyle = this.getThemeCSS('dark') || '';
			styleTag.textContent = `${lightThemeStyle}\n${darkThemeStyle}`;
		},
		/**
		 * Writes font imports to DOM link tag
		 */
		async populateFonts(manualTheme?: string) {
			const fontTag: HTMLStyleElement | null = document.querySelector(`link#${THEME_FONTS_STYLE_TAG_ID}`);
			if (!fontTag) {
				return console.error(`Link tag with ID ${THEME_FONTS_STYLE_TAG_ID} does not exist in document`);
			}

			let currentTheme = 'light';

			if (manualTheme) {
				currentTheme = manualTheme;
			} else {
				const userStore = useUserStore();
				const user = userStore.currentUser as User | null;
				if (user !== null && user.theme) {
					currentTheme = user.theme;
				}
			}

			this.externalFonts = extractFontsFromTheme(this.themeOverrides[currentTheme], internalFonts);

			if (this.externalFonts.length > 0) {
				fontTag.setAttribute('href', `${resolveFontLink(this.externalFonts)}`);
			} else {
				fontTag.removeAttribute('href');
			}
		},
		/**
		 * When updates are passed, deep object paths are compared to the same
		 * paths in the base themes. The updates are narrowed to only the values
		 * that have been altered, and whose path exists in the base theme. Extra
		 * properties are ignored.
		 *
		 * @param updates Updates object in the form
		 *  {
		 *  	[theme name]: {
		 *  		'full.setting.path': value,
		 *  		...
		 *  	}
		 *  }
		 *
		 */
		async updateThemeOverrides(updates: Record<string, any>) {
			const changes: ThemeOverrides = {};
			for (const theme in updates) {
				if (Object.keys(this.themeBase).includes(theme)) {
					// Unflatten the list of updates
					const expanded: ThemeOverrides = unflatten(updates[theme]);
					// What we send up will completely overwrite the current overrides,
					// so we need to make sure to merge the new overrides into the current
					const mergedOverrides = merge(this.themeOverrides[theme] || {}, expanded);
					// Return edits that differ from base theme
					const diff = deepDiff(this.themeBase[theme as ThemeVariants].theme, mergedOverrides);
					/**
					 * If diff is an empty object, that means the local overrides are
					 * equal to the base theme. In that case, we still want to set it
					 * in changes. Sending up an empty object will delete the
					 * theme's overrides entry from the database.
					 */
					changes[theme as ThemeVariants] = diff;
				}
			}

			try {
				const response = await api.patch(`/settings`, { theme_overrides: changes });
				this.themeOverrides = response.data.data.theme_overrides;
				notify({
					title: i18n.global.t('theme_update_success'),
				});

				this.populateStyles();
			} catch (err: any) {
				unexpectedError(err);
			}
		},
		setEditingTheme(theme: string) {
			if (availableThemes.includes(theme)) {
				this.editingTheme = theme;
			} else {
				this.editingTheme = availableThemes[0];
			}
			return true;
		},
		setAppTheme(manualTheme?: string) {
			document.body.classList.remove('dark');
			document.body.classList.remove('light');
			document.body.classList.remove('auto');

			// Default to light
			let theme = 'light';

			if (!manualTheme) {
				// If a manualTheme wasn't passed, we'll try getting it manually
				const userStore = useUserStore();
				const user = userStore.currentUser as User | null;
				if (user !== null && user.theme) {
					theme = user.theme;
				}
			} else {
				theme = manualTheme;
				document
					.querySelector('head meta[name="theme-color"]')
					?.setAttribute('content', manualTheme === 'light' ? '#ffffff' : '#263238');
			}
			// Default to light mode
			document.body.classList.add(theme);
			this.populateFonts(theme);
		},
	},
});
