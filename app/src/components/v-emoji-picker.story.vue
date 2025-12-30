<script setup lang="ts">
import VEmojiPicker from './v-emoji-picker.vue';
import { logEvent } from 'histoire/client';
</script>

<template>
	<Story title="VEmojiPicker">
		<VEmojiPicker @emoji-selected="logEvent('emoji-selected', $event)">My Button</VEmojiPicker>
	</Story>
</template>
