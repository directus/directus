<template>
	<v-dialog :model-value="isOpen" persistent @esc="router.push('/settings/roles')">
		<v-card>
			<v-card-title>
				{{ t('create_role') }}
			</v-card-title>
			<v-card-text>
				<div class="form-grid">
					<div class="field full">
						<v-input v-model="roleName" autofocus :placeholder="t('role_name') + '...'" @keyup.enter="save" />
					</div>

					<div class="field half">
						<p class="type-label">{{ t('fields.directus_roles.app_access') }}</p>
						<v-checkbox v-model="appAccess" block :label="t('enabled')" />
					</div>

					<div class="field half">
						<p class="type-label">{{ t('fields.directus_roles.admin_access') }}</p>
						<v-checkbox v-model="adminAccess" block :label="t('enabled')" />
					</div>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-button to="/settings/roles" secondary>{{ t('cancel') }}</v-button>
				<v-button :disabled="roleName === null" :loading="saving" @click="save">{{ t('save') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import api from '@/api';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { unexpectedError } from '@/utils/unexpected-error';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { appRecommendedPermissions } from './app-permissions';

const { t } = useI18n();

const router = useRouter();

const isOpen = useDialogRoute();

const roleName = ref<string | null>(null);
const appAccess = ref(true);
const adminAccess = ref(false);

const { saving, save } = useSave();

function useSave() {
	const saving = ref(false);

	return { saving, save };

	async function save() {
		saving.value = true;

		try {
			const roleResponse = await api.post('/roles', {
				name: roleName.value,
				admin_access: adminAccess.value,
				app_access: appAccess.value,
			});

			if (appAccess.value === true && adminAccess.value === false) {
				await api.post(
					'/permissions',
					appRecommendedPermissions.map((permission) => ({
						...permission,
						role: roleResponse.data.data.id,
					}))
				);
			}

			router.push(`/settings/roles/${roleResponse.data.data.id}`);
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			saving.value = false;
		}
	}
}
</script>

<style lang="scss" scoped>
.form-grid {
	--form-horizontal-gap: 12px;
	--form-vertical-gap: 24px;

	.type-label {
		font-size: 1rem;
	}
}
</style>
