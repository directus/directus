<script setup lang="ts">
import { ref } from 'vue';
import VImage from './v-image.vue';

const src = ref('https://raw.githubusercontent.com/directus/directus/refs/heads/main/app/src/assets/logo-dark.svg');
</script>

<template>
	<Story title="VImage" icon="material-symbols:image">
		<v-image :src />

		<template #controls>
			<HstText v-model="src" title="Src" />
		</template>
	</Story>
</template>
