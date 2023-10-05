<script setup lang="ts">
import type { ExtensionInfo } from '@directus/types';

defineProps<{
	type: ExtensionInfo['type'];
	name: ExtensionInfo['name'];
}>();
</script>

<template>
	<v-list-item block clickable>{{ type }} {{ name }}</v-list-item>
</template>
