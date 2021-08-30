<template>
	<div class="actions">
		<v-button v-tooltip.bottom="t('save')" :loading="loading" icon rounded @click="save">
			<v-icon name="check" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, ref } from 'vue';
import { Permission } from '@directus/shared/types';
import api from '@/api';
import { useRouter } from 'vue-router';
import { unexpectedError } from '@/utils/unexpected-error';
import { isPermissionEmpty } from '@/utils/is-permission-empty';

export default defineComponent({
	props: {
		roleKey: {
			type: String,
			default: null,
		},
		permission: {
			type: Object as PropType<Permission>,
			required: true,
		},
	},
	emits: ['refresh'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const router = useRouter();

		const loading = ref(false);

		return { t, save, loading };

		async function save() {
			loading.value = true;

			try {
				if (isPermissionEmpty(props.permission)) {
					await api.delete(`/permissions/${props.permission.id}`);
				} else {
					await api.patch(`/permissions/${props.permission.id}`, props.permission);
				}

				emit('refresh');
				router.push(`/settings/roles/${props.roleKey || 'public'}`);
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.actions {
	display: contents;
}

.v-button:not(:last-child) {
	margin-right: 8px;
}
</style>
