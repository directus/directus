<script setup lang="ts">
import { ref } from 'vue';
import VDrawer from './v-drawer.vue';

const open = ref(false);
const title = ref('My Drawer');
</script>

<template>
	<Story title="VDrawer">
		<v-button @click="open = true">Open</v-button>
		<v-drawer v-model="open" :title @cancel="open = false" @apply="open = false">
			<template #actions>
				<v-button icon rounded @click="open = false">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="drawer-content">
				<v-input />
			</div>
		</v-drawer>

		<template #controls>
			<HstText v-model="title" title="Title" />
			<HstCheckbox v-model="open" title="Open" />
		</template>
	</Story>
</template>

<style>
.drawer-content {
	padding: var(--content-padding);
}
</style>
