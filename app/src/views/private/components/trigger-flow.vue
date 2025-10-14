<script setup lang="ts">
import { injectUseFlows } from '@/composables/use-flows';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const {
	checkFlowDisabled,
	checkFlowRunning,
	confirmButtonCTA,
	confirmDialogDetails,
	confirmRunFlow,
	confirmUnsavedChanges,
	confirmValues,
	displayCustomConfirmDialog,
	displayUnsavedChangesDialog,
	getFlowTooltip,
	isConfirmButtonDisabled,
	manualFlows,
	onFlowClick,
	onRefreshCallback,
	resetConfirm,
	runManualFlow,
} = injectUseFlows();

function handleRunManualFlow(flowId: string, isActionDisabled = false) {
	runManualFlow(flowId, isActionDisabled, onRefreshCallback);
}
</script>

<template>
	<slot>
		<div class="fields">
			<div v-for="manualFlow in manualFlows" :key="manualFlow.id" class="field full">
				<v-button
					v-tooltip="getFlowTooltip(manualFlow)"
					small
					full-width
					:style="{ '--v-button-background-color': manualFlow.color }"
					:loading="checkFlowRunning(manualFlow)"
					:disabled="checkFlowDisabled(manualFlow)"
					@click="onFlowClick(manualFlow.id)"
				>
					<v-icon :name="manualFlow.icon ?? 'bolt'" small left />
					{{ manualFlow.name }}
				</v-button>

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
			</div>
		</div>
	</slot>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/colors';

.fields {
	--theme--form--row-gap: 16px;

	@include mixins.form-grid;

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
