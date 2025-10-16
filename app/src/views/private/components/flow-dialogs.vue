<script setup lang="ts">
import { FlowDialogsContext, injectRunManualFlow } from '@/composables/use-flows';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<FlowDialogsContext>();

const { runManualFlow } = injectRunManualFlow();

function handleRunManualFlow(flowId: string, isActionDisabled = false) {
	runManualFlow(flowId, isActionDisabled);
}
</script>

<template>
	<v-dialog
		:model-value="displayUnsavedChangesDialog.value"
		keep-behind
		@esc="resetConfirm"
		@apply="confirmUnsavedChanges(flowToConfirm.value!)"
	>
		<v-card>
			<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
			<v-card-text>{{ t('run_flow_on_current_edited_confirm') }}</v-card-text>

			<v-card-actions>
				<v-button secondary @click="resetConfirm">
					{{ t('cancel') }}
				</v-button>
				<v-button @click="confirmUnsavedChanges(flowToConfirm.value!)">
					{{ confirmButtonCTA }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog
		:model-value="displayCustomConfirmDialog.value"
		keep-behind
		@esc="resetConfirm"
		@apply="handleRunManualFlow(flowToConfirm.value!, isConfirmButtonDisabled.value)"
	>
		<v-card>
			<v-card-title>{{ confirmDialogDetails.value?.description ?? t('run_flow_confirm') }}</v-card-title>
			<v-card-text class="confirm-form">
				<v-form
					v-if="confirmDialogDetails.value?.fields.length"
					:fields="confirmDialogDetails.value.fields"
					:model-value="confirmValues.value"
					autofocus
					primary-key="+"
					@update:model-value="updateFieldValues($event)"
				/>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="resetConfirm">
					{{ t('cancel') }}
				</v-button>
				<v-button
					:disabled="isConfirmButtonDisabled.value"
					@click="handleRunManualFlow(flowToConfirm.value!, isConfirmButtonDisabled.value)"
				>
					{{ confirmButtonCTA }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
