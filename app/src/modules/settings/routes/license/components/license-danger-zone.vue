<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VNotice from '@/components/v-notice.vue';
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';

defineProps<{
	title: string;
	canDeactivate: boolean;
	deactivating: boolean;
	envNotice?: string | null;
}>();

defineEmits<{
	deactivate: [];
}>();
</script>

<template>
	<section class="danger-zone">
		<InterfacePresentationDivider icon="warning" :title="title" color="var(--theme--danger)" />

		<VNotice v-if="envNotice" type="info">
			{{ envNotice }}
		</VNotice>

		<VButton kind="danger" :disabled="!canDeactivate" :loading="deactivating" @click="$emit('deactivate')">
			{{ $t('license.deactivate') }}
		</VButton>
	</section>
</template>

<style scoped lang="scss">
.danger-zone {
	display: grid;
	gap: 1rem;
}
</style>
