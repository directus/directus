<script setup lang="ts">
import { logEvent } from 'histoire/client';
import VEmojiPicker from './v-emoji-picker.vue';
</script>

<template>
	<Story title="VEmojiPicker">
		<v-emoji-picker @emoji-selected="logEvent('emoji-selected', $event)">My Button</v-emoji-picker>
	</Story>
</template>
