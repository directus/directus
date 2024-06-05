<script setup lang="ts">
import api from '@/api';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { unexpectedError } from '@/utils/unexpected-error';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { appRecommendedPermissions } from '@/app-permissions.js';

const { t } = useI18n();

const router = useRouter();

const isOpen = useDialogRoute();

const name = ref<string | null>(null);
const appAccess = ref(true);
const adminAccess = ref(false);

const { saving, save } = useSave();

function useSave() {
	const saving = ref(false);

	return { saving, save };

	async function save() {
		saving.value = true;

		try {
			const policyResponse = await api.post('/policies', {
				name: name.value,
				admin_access: adminAccess.value,
				app_access: appAccess.value,
			});

			if (appAccess.value === true && adminAccess.value === false) {
				await api.post(
					'/permissions',
					appRecommendedPermissions.map((permission) => ({
						...permission,
						policy: policyResponse.data.data.id,
					})),
				);
			}

			router.push(`/settings/policies/${policyResponse.data.data.id}`);
		} catch (error) {
			unexpectedError(error);
		} finally {
			saving.value = false;
		}
	}
}
</script>

<template>
	<v-dialog :model-value="isOpen" persistent @esc="router.push('/settings/policies')">
		<v-card>
			<v-card-title>
				{{ t('create_policy') }}
			</v-card-title>
			<v-card-text>
				<div class="form-grid">
					<div class="field full">
						<v-input v-model="name" autofocus :placeholder="t('policy_name') + '...'" @keyup.enter="save" />
					</div>

					<div class="field half">
						<p class="type-label">{{ t('fields.directus_policies.app_access') }}</p>
						<v-checkbox v-model="appAccess" block :label="t('enabled')" />
					</div>

					<div class="field half">
						<p class="type-label">{{ t('fields.directus_policies.admin_access') }}</p>
						<v-checkbox v-model="adminAccess" block :label="t('enabled')" />
					</div>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-button to="/settings/policies" secondary>{{ t('cancel') }}</v-button>
				<v-button :disabled="name === null" :loading="saving" @click="save">{{ t('save') }}</v-button>
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
