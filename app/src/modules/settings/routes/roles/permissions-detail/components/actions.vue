<template>
	<div class="actions">
		<v-button @click="save" :loading="loading">{{ $t('save') }}</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, inject } from '@vue/composition-api';
import { Permission } from '@/types';
import api from '@/api';
import router from '@/router';

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
		const error = ref<any>();

		return { save, loading };

		async function save() {
			loading.value = true;
			error.value = null;

			try {
				await api.patch(`/permissions/${props.permission.id}`, props.permission);
				emit('refresh');
				router.push(`/settings/roles/${props.roleKey || 'public'}`);
			} catch (err) {
				error.value = err;
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
