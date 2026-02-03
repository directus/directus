<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';

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
	<VDialog
		:model-value="displayUnsavedChangesDialog"
		keep-behind
		@esc="resetConfirm"
		@apply="confirmUnsavedChanges(currentFlowId!)"
	>
		<VCard>
			<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
			<VCardText>{{ $t('run_flow_on_current_edited_confirm') }}</VCardText>

			<VCardActions>
				<VButton secondary @click="resetConfirm">
					{{ $t('cancel') }}
				</VButton>
				<VButton @click="confirmUnsavedChanges(currentFlowId!)">
					{{ confirmButtonCTA }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VDialog
		:model-value="displayCustomConfirmDialog"
		keep-behind
		@esc="resetConfirm"
		@apply="confirmCustomDialog(currentFlowId!)"
	>
		<VCard>
			<VCardTitle>{{ confirmDialogDetails?.description ?? $t('run_flow_confirm') }}</VCardTitle>
			<VCardText class="confirm-form">
				<VForm
					v-if="confirmDialogDetails?.fields.length"
					:fields="confirmDialogDetails.fields"
					:model-value="confirmValues"
					autofocus
					primary-key="+"
					@update:model-value="updateFieldValues($event)"
				/>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="resetConfirm">
					{{ $t('cancel') }}
				</VButton>
				<VButton :disabled="isConfirmButtonDisabled" @click="confirmCustomDialog(currentFlowId!)">
					{{ confirmButtonCTA }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
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
