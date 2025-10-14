<script setup lang="ts">
defineProps<{
	displayUnsavedChangesDialog: boolean;
	displayCustomConfirmDialog: boolean;
	resetConfirm: () => void;
	confirmUnsavedChanges: (flowId: string) => void;
	isConfirmButtonDisabled: boolean;
	confirmButtonCTA: string;
	handleRunManualFlow: (flowId: string, isActionDisabled?: boolean) => void;
	confirmRunFlow: string | null;
	confirmDialogDetails: {
		description: any;
		fields: any;
	} | null;
	confirmValues: Record<string, any> | null | undefined;
}>();
</script>

<template>
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
