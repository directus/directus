<script setup lang="ts">
import { useFlows } from '@/composables/use-flows';
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	flowId: string;
	collection: string;
	primaryKey?: string | number;
	selection?: (number | string)[];
	location: 'collection' | 'item';
	hasEdits?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: undefined,
	selection: () => [],
	hasEdits: false,
});

const emit = defineEmits(['refresh']);

const { t } = useI18n();

const { collection, primaryKey, selection, location, hasEdits } = toRefs(props);

const {
	runningFlows,
	confirmRunFlow,
	confirmValues,
	manualFlows,
	isConfirmButtonDisabled,
	confirmButtonCTA,
	confirmDialogDetails,
	displayUnsavedChangesDialog,
	displayCustomConfirmDialog,
	getFlowTooltip,
	checkFlowDisabled,
	resetConfirm,
	onFlowClick,
	confirmUnsavedChanges,
	runManualFlow,
} = useFlows({
	collection,
	primaryKey,
	selection,
	location,
	hasEdits,
});

function handleRunManualFlow(flowId: string, isActionDisabled = false) {
	runManualFlow(flowId, isActionDisabled, () => emit('refresh'));
}

const flow = computed(() => manualFlows.value.find((f) => f.id === props.flowId));

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

	<v-dialog
		:model-value="displayUnsavedChangesDialog"
		keep-behind
		@esc="resetConfirm"
		@apply="confirmUnsavedChanges(confirmRunFlow!)"
	>
		<v-card>
			<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
			<v-card-text>{{ t('run_flow_on_current_edited_confirm') }}</v-card-text>

			<v-card-actions>
				<v-button secondary @click="resetConfirm">
					{{ t('cancel') }}
				</v-button>
				<v-button :disabled="isConfirmButtonDisabled" @click="confirmUnsavedChanges(confirmRunFlow!)">
					{{ confirmButtonCTA }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog
		:model-value="displayCustomConfirmDialog"
		keep-behind
		@esc="resetConfirm"
		@apply="handleRunManualFlow(confirmRunFlow!, isConfirmButtonDisabled)"
	>
		<v-card>
			<v-card-title>{{ confirmDialogDetails!.description ?? t('run_flow_confirm') }}</v-card-title>
			<v-card-text class="confirm-form">
				<v-form
					v-if="confirmDialogDetails!.fields && confirmDialogDetails!.fields.length > 0"
					:fields="confirmDialogDetails!.fields"
					:model-value="confirmValues"
					autofocus
					primary-key="+"
					@update:model-value="confirmValues = $event"
				/>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="resetConfirm">
					{{ t('cancel') }}
				</v-button>
				<v-button
					:disabled="isConfirmButtonDisabled"
					@click="handleRunManualFlow(confirmRunFlow!, isConfirmButtonDisabled)"
				>
					{{ confirmButtonCTA }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
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
