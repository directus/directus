<script setup lang="ts">
import { EmojiButton } from '@joeattardi/emoji-button';
import { onUnmounted } from 'vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

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

<template>
	<v-button class="emoji-button" x-small secondary icon @click="emojiPicker.togglePicker($event.target as HTMLElement)">
		<v-icon name="insert_emoticon" />
	</v-button>
</template>
