<template>
	<div class="actions">
		<v-button @click="save" :loading="loading" icon rounded v-tooltip.bottom="$t('save')">
			<v-icon name="check" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, inject } from '@vue/composition-api';
import { Permission } from '@/types';
import api from '@/api';
import router from '@/router';
import { unexpectedError } from '@/utils/unexpected-error';

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
	setup(props, { emit }) {
		const loading = ref(false);

		return { save, loading };

		async function save() {
			loading.value = true;

			try {
				await api.patch(`/permissions/${props.permission.id}`, props.permission);
				emit('refresh');
				router.push(`/settings/roles/${props.roleKey || 'public'}`);
			} catch (err) {
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
