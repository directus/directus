<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	status: string;
}>();

const { t } = useI18n();

const statusStyle = computed(() => {
	switch (props.status) {
		case 'ready':
			return {
				color: 'var(--theme--success)',
				background: 'var(--theme--success-background)',
			};
		case 'building':
			return {
				color: 'var(--theme--warning)',
				background: 'var(--theme--warning-background)',
			};
		case 'error':
		case 'canceled':
			return {
				color: 'var(--theme--danger)',
				background: 'var(--theme--danger-background)',
			};
		default:
			return {
				color: 'var(--theme--foreground-subdued)',
				background: 'var(--theme--background-normal)',
			};
	}
});

const statusIcon = computed(() => {
	switch (props.status) {
		case 'ready':
			return 'check';
		case 'building':
			return 'autorenew';
		case 'error':
		case 'canceled':
			return 'error';
		default:
			return 'circle';
	}
});

const statusLabel = computed(() => {
	return t(`deployment.runs_status.${props.status}`);
});
</script>

<template>
	<VChip
		small
		disabled
		:style="{
			'--v-chip-color': statusStyle.color,
			'--v-chip-background-color': statusStyle.background,
		}"
		:class="['deployment-status', status, 'has-icon']"
	>
		<VIcon :name="statusIcon" small left />
		{{ statusLabel }}
	</VChip>
</template>

<style scoped lang="scss">
.deployment-status {
	&.has-icon {
		--v-chip-padding: 0 8px 0 4px;
	}

	&.building {
		:deep(.v-icon) {
			animation: spin 1s linear infinite;
		}
	}
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}
</style>
