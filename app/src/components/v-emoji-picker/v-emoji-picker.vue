<template>
	<v-button
		class="emoji-button"
		x-small
		secondary
		icon
		@click="emojiPicker.toggle({ referenceElement: $event.target, triggerElement: $event.target })"
	>
		<v-icon name="insert_emoticon" />
	</v-button>
</template>

<script setup lang="ts">
import { createPopup } from '@picmo/popup-picker';
import { en as defaultDictionary, LocalStorageProvider, EmojiRecord } from 'picmo';
import { Emoji, MessagesDataset, Locale, flattenEmojiData } from 'emojibase';
import { useI18n } from 'vue-i18n';
import { onUnmounted } from 'vue';

interface LocalizedEmojiRecord extends EmojiRecord {
	locale: string;
}

const { t, locale } = useI18n();

const dictionary = {
	'categories.recents': t('emoji_picker.recently_used'),
	'error.load': t('emoji_picker.load_error'),
	'recents.clear': t('emoji_picker.clear_recents'),
	'recents.none': t('emoji_picker.no_recents'),
	retry: t('emoji_picker.retry'),
	'search.clear': t('emoji_picker.clear_search'),
	'search.error': t('emoji_picker.search_error'),
	'search.notFound': t('emoji_picker.search_not_found'),
	search: t('emoji_picker.search'),
};

const emojiBase = await loadEmojiBase();

// Custom recents provider with localized data
class LocalizedRecentsProvider extends LocalStorageProvider {
	addOrUpdateRecent(emoji: EmojiRecord, maxCount: number): void {
		const localizedEmoji: LocalizedEmojiRecord = { ...emoji, locale: emojiBase.locale };
		super.addOrUpdateRecent(localizedEmoji, maxCount);
	}
	getRecents(maxCount: number): EmojiRecord[] {
		const recents = super.getRecents(maxCount) as LocalizedEmojiRecord[];
		let flatEmojiData: Emoji[] | undefined = undefined;
		return recents.map((recentEmoji) => {
			if (recentEmoji.locale === emojiBase.locale || !emojiBase.emojiData) {
				return recentEmoji;
			}
			if (!flatEmojiData) {
				flatEmojiData = flattenEmojiData(emojiBase.emojiData);
			}
			const localizedEmoji = flatEmojiData.find((emoji) => emoji.hexcode === recentEmoji.hexcode);
			if (localizedEmoji) {
				return getEmojiRecord(localizedEmoji);
			}
			return recentEmoji;
		});
	}
}

const emojiPicker = createPopup(
	{
		theme: 'autoTheme',
		emojisPerRow: 8,
		maxRecents: 24,
		initialCategory: 'recents',
		emojiData: emojiBase.emojiData,
		messages: emojiBase.messages,
		locale: emojiBase.locale,
		i18n: { ...defaultDictionary, ...dictionary, ...emojiBase.dictionary },
		recentsProvider: new LocalizedRecentsProvider(),
	},
	{
		position: 'bottom',
		showCloseButton: false,
		onPositionLost: 'close',
	}
);

const emit = defineEmits(['emoji-selected']);
emojiPicker.addEventListener('emoji:select', (event) => {
	emit('emoji-selected', event.emoji);
});

onUnmounted(() => {
	emojiPicker.destroy();
});

async function loadEmojiBase() {
	const data: {
		emojiData?: Emoji[];
		messages?: MessagesDataset;
		locale: Locale;
		dictionary?: Record<string, string>;
	} = { locale: 'en' };
	const currentLocale = locale.value.toLocaleLowerCase();
	// Try to fetch emoji data for current full locale first, then for current language and lastly for 'en'
	for (const variant of [currentLocale, currentLocale.split('-')[0], 'en']) {
		try {
			data.emojiData = (
				await import(
					// Note: We need a relative path here due to Rollup dynamic import limitations
					// https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
					`../../../node_modules/emojibase-data/${variant}/data.json`
				)
			).default;
			// Set locale to the one which could actually be loaded
			data.locale = variant as Locale;
			break;
		} catch {
			// Not expected to fail since at least the static fallback of 'en' should work
			if (variant === 'en') {
				// eslint-disable-next-line no-console
				console.warn('Failed to load emoji data - picmo attempts to fetch data from CDN');
				break;
			}
		}
	}
	if (data.locale) {
		try {
			data.messages = (await import(`../../../node_modules/emojibase-data/${data.locale}/messages.json`)).default;
			data.dictionary = data.messages?.groups.reduce((accumulator, currentValue) => {
				accumulator[`categories.${currentValue.key}`] = currentValue.message;
				return accumulator;
			}, {} as Record<string, string>);
		} catch {
			// Not expected to fail since emoji data has been loaded successfully as well
			// eslint-disable-next-line no-console
			console.warn('Failed to load emoji messages - picmo attempts to fetch data from CDN');
		}
	}
	return data;
}

function getEmojiRecord(emoji: Emoji): EmojiRecord {
	return {
		emoji: emoji.emoji,
		label: emoji.label,
		tags: emoji.tags,
		skins: emoji.skins?.map((skin) => getEmojiRecord(skin)),
		order: emoji.order,
		custom: false,
		hexcode: emoji.hexcode,
		version: emoji.version,
	};
}
</script>

<style lang="scss">
@import './picmo-overrides.scss';
</style>
