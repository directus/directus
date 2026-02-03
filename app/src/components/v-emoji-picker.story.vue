<script setup lang="ts">
import { logEvent } from 'histoire/client';
import VEmojiPicker from './v-emoji-picker.vue';
</script>

<template>
	<Story title="VEmojiPicker">
		<VEmojiPicker @emoji-selected="logEvent('emoji-selected', $event)">My Button</VEmojiPicker>
	</Story>
</template>
