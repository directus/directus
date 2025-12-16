<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSave } from './use-save';

const router = useRouter();

const isOpen = useDialogRoute();

const name = ref<string | null>(null);

const { saving, save } = useSave({ name });
</script>

<template>
	<v-dialog :model-value="isOpen" persistent @esc="router.push('/settings/roles')" @apply="save">
		<v-card>
			<v-card-title>
				{{ $t('create_role') }}
			</v-card-title>
			<v-card-text>
				<div class="form-grid">
					<div class="field full">
						<v-input v-model="name" autofocus :placeholder="$t('role_name') + '...'" :max-length="100" />
					</div>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-button to="/settings/roles" secondary>{{ $t('cancel') }}</v-button>
				<v-button :disabled="name === null" :loading="saving" @click="save">{{ $t('save') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.form-grid {
	--theme--form--column-gap: 12px;
	--theme--form--row-gap: 24px;

	.type-label {
		font-size: 1rem;
	}
}
</style>
