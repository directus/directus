<template>
	<div class="actions">
		<v-button @click="save" :loading="loading" icon rounded v-tooltip.bottom="t('save')">
			<v-icon name="check" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, ref } from 'vue';
import { Permission } from '@/types';
import api from '@/api';
import { useRouter } from 'vue-router';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	emits: ['refresh'],
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
		const { t } = useI18n();

		const router = useRouter();

		const loading = ref(false);

		return { t, save, loading };

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
