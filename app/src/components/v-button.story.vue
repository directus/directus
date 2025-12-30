<script setup lang="ts">
import VButton from './v-button.vue';
import { logEvent } from 'histoire/client';
</script>

<template>
	<Story title="VButton">
		<VButton @click="logEvent('click', $event)">My Button</VButton>
	</Story>
</template>
