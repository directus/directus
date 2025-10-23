<script setup lang="ts">
interface FlowDialogsContext {
	confirmButtonCTA: string;
	confirmDialogDetails: {
		description: any;
		fields: any;
	} | null;
	confirmUnsavedChanges: (flowId: string) => void;
	confirmCustomDialog: (flowId: string) => void;
	confirmValues: { [key: string]: any } | null;
	currentFlowId: string | null;
	displayCustomConfirmDialog: boolean;
	displayUnsavedChangesDialog: boolean;
	isConfirmButtonDisabled: boolean;
	resetConfirm: () => void;
	updateFieldValues: (event: Record<string, any>) => void;
}

defineProps<FlowDialogsContext>();
</script>

<template>
	<v-dialog
		:model-value="displayUnsavedChangesDialog"
		keep-behind
		@esc="resetConfirm"
		@apply="confirmUnsavedChanges(currentFlowId!)"
	>
		<v-card>
			<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
			<v-card-text>{{ $t('run_flow_on_current_edited_confirm') }}</v-card-text>

			<v-card-actions>
				<v-button secondary @click="resetConfirm">
					{{ $t('cancel') }}
				</v-button>
				<v-button @click="confirmUnsavedChanges(currentFlowId!)">
					{{ confirmButtonCTA }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog
		:model-value="displayCustomConfirmDialog"
		keep-behind
		@esc="resetConfirm"
		@apply="confirmCustomDialog(currentFlowId!)"
	>
		<v-card>
			<v-card-title>{{ confirmDialogDetails?.description ?? $t('run_flow_confirm') }}</v-card-title>
			<v-card-text class="confirm-form">
				<v-form
					v-if="confirmDialogDetails?.fields.length"
					:fields="confirmDialogDetails.fields"
					:model-value="confirmValues"
					autofocus
					primary-key="+"
					@update:model-value="updateFieldValues($event)"
				/>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="resetConfirm">
					{{ $t('cancel') }}
				</v-button>
				<v-button :disabled="isConfirmButtonDisabled" @click="confirmCustomDialog(currentFlowId!)">
					{{ confirmButtonCTA }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.confirm-form {
	--theme--form--column-gap: 24px;
	--theme--form--row-gap: 24px;

	margin-block-start: var(--v-card-padding, 16px);

	:deep(.type-label) {
		font-size: 1rem;
	}
}
</style>
