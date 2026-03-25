<script setup lang="ts">
import { logEvent } from 'histoire/client';
import VButton from './v-button.vue';
</script>

<template>
	<Story title="VButton">
		<VButton @click="logEvent('click', $event)">My Button</VButton>
	</Story>
</template>
