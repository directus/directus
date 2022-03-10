<template>
	<v-button class="emoji-button" x-small secondary icon @click="emojiPicker.togglePicker($event.target as HTMLElement)">
		<v-icon name="insert_emoticon" />
	</v-button>
</template>

<script setup lang="ts">
import { EmojiButton } from '@joeattardi/emoji-button';
import { onUnmounted } from 'vue';

const emojiPicker = new EmojiButton({
	theme: 'auto',
	zIndex: 10000,
	position: 'bottom',
	emojisPerRow: 8,
});
const emit = defineEmits(['emoji-selected']);

emojiPicker.on('emoji', (event) => {
	emit('emoji-selected', event.emoji);
});

onUnmounted(() => {
	emojiPicker.destroyPicker();
});
</script>

<style scoped lang="scss"></style>

<style lang="scss">
.emoji-picker__wrapper {
	box-shadow: var(--card-shadow);

	.emoji-picker {
		--category-button-active-color: var(--primary);
		--font: var(--family-sans-serif);
		--text-color: var(--foreground-normal);
		--dark-text-color: var(--foreground-normal);
		--secondary-text-color: var(--foreground-normal-alt);
		--dark-secondary-text-color: var(--foreground-normal-alt);

		border-radius: var(--border-radius);
		border: var(--border-width) solid var(--border-normal);
		background-color: var(--background-page);
	}

	.emoji-picker__search-container {
		.emoji-picker__search-icon {
			top: 10px;
		}

		input.emoji-picker__search {
			border-radius: var(--border-radius);
			border: var(--border-width) solid var(--border-normal);
			background-color: var(--background-page);

			height: 40px;

			&:hover {
				border-color: var(--border-normal-alt);
			}

			&:focus {
				border-color: var(--primary);
			}

			&::placeholder {
				color: var(--foreground-subdued);
			}
		}
	}

	.emoji-picker__content {
		padding: 8px 0 0 0;

		.emoji-picker__emojis {
			border-top: 2px solid var(--border-normal);
			border-bottom: 2px solid var(--border-normal);
		}
	}

	.emoji-picker__preview {
		border-top: none;
	}

	.emoji-picker__emoji {
		&:hover {
			background-color: var(--background-normal);
			border-radius: var(--border-radius);
		}
	}
}
</style>
