<template>
	<v-dialog active persistent>
		<v-card>
			<v-card-title>
				{{ $t('create_role') }}
			</v-card-title>
			<v-card-text>
				<v-input v-model="roleName" autofocus @keyup.enter="save" :placeholder="$t('role_name') + '...'" />
			</v-card-text>
			<v-card-actions>
				<v-button to="/settings/roles" secondary>{{ $t('cancel') }}</v-button>
				<v-button @click="save" :loading="saving">{{ $t('save') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import api from '@/api';
import router from '@/router';

export default defineComponent({
	setup() {
		const roleName = ref<string>();

		const { saving, error, save } = useSave();

		return { roleName, saving, error, save };

		function useSave() {
			const saving = ref(false);
			const error = ref<any>();

			return { saving, error, save };

			async function save() {
				saving.value = true;
				error.value = null;

				try {
					const roleResponse = await api.post('/roles', { name: roleName.value });
					router.push(`/settings/roles/${roleResponse.data.data.id}`);
				} catch (err) {
					error.value = err;
				} finally {
					saving.value = false;
				}
			}
		}
	}
});
</script>

