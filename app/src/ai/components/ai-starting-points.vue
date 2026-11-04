<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { findPlaceholderMarker } from '@/ai/prompt-markers';
import VButton from '@/components/v-button.vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';

const props = defineProps<{
	points: { key: string; icon: string; label: string }[];
	prompt: unknown;
}>();

const emit = defineEmits<{
	apply: [key: string];
	startOver: [];
}>();

const { t } = useI18n();

const marker = computed(() => findPlaceholderMarker(String(props.prompt ?? '')));
</script>

<template>
	<div v-if="!prompt" class="starting-points">
		<span class="type-note label">{{ t('ai.flow_operations.start_from') }}</span>
		<VChip v-for="point in points" :key="point.key" clickable small outlined @click="emit('apply', point.key)">
			<VIcon :name="point.icon" x-small left />
			{{ point.label }}
		</VChip>
	</div>

	<template v-else>
		<VNotice v-if="marker" type="warning">
			<span v-md="{ value: t('ai.flow_operations.replace_marker', { marker }), target: '_blank' }" />
		</VNotice>

		<VButton class="start-over" secondary x-small @click="emit('startOver')">
			<VIcon name="restart_alt" x-small left />
			{{ t('ai.flow_operations.start_over') }}
		</VButton>
	</template>
</template>

<style lang="scss" scoped>
.starting-points {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	margin-block-start: calc(-1 * var(--theme--form--row-gap) + 0.5rem);

	.label {
		font-style: normal;
		margin-inline-end: 0.25rem;
	}
}

.start-over {
	align-self: flex-start;
}
</style>
