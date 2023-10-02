<script setup lang="ts">
import api from '@/api';
import { isPermissionEmpty } from '@/utils/is-permission-empty';
import { unexpectedError } from '@/utils/unexpected-error';
import { Permission } from '@directus/types';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps<{
	permission: Permission;
	roleKey?: string;
}>();

const emit = defineEmits(['refresh']);

const { t } = useI18n();

const router = useRouter();

const loading = ref(false);

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
</script>

<template>
	<div class="actions">
		<v-button v-tooltip.bottom="t('save')" :loading="loading" icon rounded @click="save">
			<v-icon name="check" />
		</v-button>
	</div>
</template>

<style lang="scss" scoped>
.actions {
	display: contents;
}

.v-button:not(:last-child) {
	margin-right: 8px;
}
</style>
