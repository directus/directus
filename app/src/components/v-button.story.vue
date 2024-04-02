<script setup lang="ts">
import { logEvent } from 'histoire/client';
import VButton from './v-button.vue';
</script>

<template>
	<Story title="VButton">
		<v-button @click="logEvent('click', $event)">My Button</v-button>
	</Story>
</template>
