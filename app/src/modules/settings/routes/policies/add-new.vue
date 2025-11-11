<script setup lang="ts">
import { useDialogRoute } from '@/composables/use-dialog-route';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSave } from './use-save.js';


const router = useRouter();

const isOpen = useDialogRoute();

const name = ref<string | null>(null);
const appAccess = ref(false);
const adminAccess = ref(false);

const { saving, save } = useSave({ name, appAccess, adminAccess });
</script>

<template>
	<v-dialog :model-value="isOpen" persistent @esc="router.push('/settings/policies')" @apply="save">
		<v-card>
			<v-card-title>
				{{ $t('create_policy') }}
			</v-card-title>
			<v-card-text>
				<div class="form-grid">
					<div class="field full">
						<v-input v-model="name" autofocus :placeholder="$t('policy_name') + '...'" :max-length="100" />
					</div>

					<div class="field half">
						<p class="type-label">{{ $t('fields.directus_policies.app_access') }}</p>
						<v-checkbox v-model="appAccess" block :label="$t('enabled')" />
					</div>

					<div class="field half">
						<p class="type-label">{{ $t('fields.directus_policies.admin_access') }}</p>
						<v-checkbox v-model="adminAccess" block :label="$t('enabled')" />
					</div>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-button to="/settings/policies" secondary>{{ $t('cancel') }}</v-button>
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
