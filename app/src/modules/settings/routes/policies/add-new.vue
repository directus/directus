<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSave } from './use-save.js';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';
import { useDialogRoute } from '@/composables/use-dialog-route';

const router = useRouter();

const isOpen = useDialogRoute();

const name = ref<string | null>(null);
const appAccess = ref(false);
const adminAccess = ref(false);

const { saving, save } = useSave({ name, appAccess, adminAccess });
</script>

<template>
	<VDialog :model-value="isOpen" persistent @esc="router.push('/settings/policies')" @apply="save">
		<VCard>
			<VCardTitle>
				{{ $t('create_policy') }}
			</VCardTitle>
			<VCardText>
				<div class="form-grid">
					<div class="field full">
						<VInput v-model="name" autofocus :placeholder="$t('policy_name') + '...'" :max-length="100" />
					</div>

					<div class="field half">
						<p class="type-label">{{ $t('fields.directus_policies.app_access') }}</p>
						<VCheckbox v-model="appAccess" block :label="$t('enabled')" />
					</div>

					<div class="field half">
						<p class="type-label">{{ $t('fields.directus_policies.admin_access') }}</p>
						<VCheckbox v-model="adminAccess" block :label="$t('enabled')" />
					</div>
				</div>
			</VCardText>
			<VCardActions>
				<VButton to="/settings/policies" secondary>{{ $t('cancel') }}</VButton>
				<VButton :disabled="name === null" :loading="saving" @click="save">{{ $t('save') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
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
