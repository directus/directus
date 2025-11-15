<script setup lang="ts">
import VErrorBoundary from './v-error-boundary.vue';

function throwError() {
	throw new Error('My Error');
}
</script>

<template>
	<Story title="VErrorBoundary" icon="material-symbols:speed-camera">
		<v-error-boundary>
			<v-button @click="throwError">Throw error</v-button>
			<template #fallback="{ error }">
				<v-notice type="warning">Unexpected Error: {{ error?.message }}</v-notice>
			</template>
		</v-error-boundary>
	</Story>
</template>
