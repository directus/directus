<script setup lang="ts">
import { injectUseFlows } from '@/composables/use-flows';
import { FlowRaw } from '@directus/types';
import { computed } from 'vue';

interface Props {
	flowId: string;
}

const props = defineProps<Props>();

const { runningFlows, manualFlows, getFlowTooltip, checkFlowDisabled, onFlowClick } = injectUseFlows();

const flow = computed(() => manualFlows.value.find((f: FlowRaw) => f.id === props.flowId));

const isFlowRunning = computed(() => runningFlows.value.includes(props.flowId));

const isFlowDisabled = computed(() => {
	if (!flow.value) return true;
	return checkFlowDisabled(flow.value);
});

const flowTooltip = computed(() => {
	if (!flow.value) return '';
	return getFlowTooltip(flow.value);
});
</script>

<template>
	<slot>
		<v-button
			v-if="flow"
			v-tooltip="flowTooltip"
			small
			full-width
			:style="{ '--v-button-background-color': flow.color }"
			:loading="isFlowRunning"
			:disabled="isFlowDisabled"
			@click="onFlowClick(flow.id)"
		>
			<v-icon :name="flow.icon ?? 'bolt'" small left />
			{{ flow.name }}
		</v-button>
	</slot>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/colors';

.v-button {
	--v-button-background-color-disabled: var(--theme--background-accent);
	--v-button-background-color-hover: color-mix(
		in srgb,
		var(--v-button-background-color),
		#{colors.$light-theme-shade} 25%
	);

	.dark & {
		--v-button-background-color-hover: color-mix(
			in srgb,
			var(--v-button-background-color),
			#{colors.$dark-theme-shade} 25%
		);
	}
}

.v-icon {
	margin-inline-end: 8px;
}

.confirm-form {
	--theme--form--column-gap: 24px;
	--theme--form--row-gap: 24px;

	margin-block-start: var(--v-card-padding, 16px);

	:deep(.type-label) {
		font-size: 1rem;
	}
}
</style>
