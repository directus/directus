<script setup lang="ts">
import { ref } from 'vue';
import VResizeable from './v-resizeable.vue';

const width = ref(300);
</script>

<template>
	<Story title="VResizeable" icon="material-symbols:arrow-range" :init-state="() => ({ minWidth: 220, maxWidth: 500 })">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-resizeable v-model:width="width" v-bind="state">
				<v-list-item>Item 1</v-list-item>
				<v-list-item>Item 2</v-list-item>
				<v-list-item>Item 3</v-list-item>
			</v-resizeable>
		</template>

		<template #controls>
			<HstNumber v-model="width" title="Width" />
		</template>
	</Story>
</template>

<style>
.custom-wrapper {
	display: flex;
}

.resize-wrapper {
	position: relative;
	background-color: var(--theme--background-normal);
}
</style>
