<script setup lang="ts">
import { logEvent } from 'histoire/client';
import VEmojiPicker from './v-emoji-picker.vue';
</script>

<template>
	<Story title="VEmojiPicker">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-emoji-picker v-bind="state" @emoji-selected="logEvent('emoji-selected', $event)">My Button</v-emoji-picker>
		</template>
	</Story>
</template>
