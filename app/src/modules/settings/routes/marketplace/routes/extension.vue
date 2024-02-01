<script setup lang="ts">
import api from '@/api';
import { ref, watchEffect } from 'vue';
import { useDialogRoute } from '@/composables/use-dialog-route';

const isOpen = useDialogRoute();

const props = defineProps<{
	extensionId: string;
}>();

const loading = ref(false);
const error = ref<unknown>(null);
const extension = ref();

watchEffect(async () => {
	if (!props.extensionId) return;

	loading.value = true;

	try {
		const response = await api.get(`/extensions/${props.extensionId}`);
		extension.value = response.data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
});
</script>

<template>
	<v-drawer :model-value="isOpen">
		<div class="drawer-item-content">
			<h1>Hi</h1>
		</div>
	</v-drawer>
</template>

<style scoped lang="scss">
.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
</style>
