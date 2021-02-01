<template>
	<v-dialog active persistent @esc="$router.push('/settings/roles')">
		<v-card>
			<v-card-title>
				{{ $t('create_role') }}
			</v-card-title>
			<v-card-text>
				<div class="form-grid">
					<div class="field full">
						<v-input v-model="roleName" autofocus @keyup.enter="save" :placeholder="$t('role_name') + '...'" />
					</div>

					<div class="field half">
						<p class="type-label">{{ $t('fields.directus_roles.app_access') }}</p>
						<v-checkbox block v-model="appAccess" :label="$t('enabled')" />
					</div>

					<div class="field half">
						<p class="type-label">{{ $t('fields.directus_roles.admin_access') }}</p>
						<v-checkbox block v-model="adminAccess" :label="$t('enabled')" />
					</div>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-button to="/settings/roles" secondary>{{ $t('cancel') }}</v-button>
				<v-button @click="save" :disabled="roleName === null" :loading="saving">{{ $t('save') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import api from '@/api';
import router from '@/router';
import { permissions } from './app-required-permissions';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	setup() {
		const roleName = ref<string | null>(null);
		const appAccess = ref(true);
		const adminAccess = ref(false);

		const { saving, save } = useSave();

		return { roleName, saving, save, appAccess, adminAccess };

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
							permissions.map((permission) => ({
								...permission,
								role: roleResponse.data.data.id,
							}))
						);
					}

					router.push(`/settings/roles/${roleResponse.data.data.id}`);
				} catch (err) {
					unexpectedError(err);
				} finally {
					saving.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	--form-horizontal-gap: 12px;
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}
</style>
