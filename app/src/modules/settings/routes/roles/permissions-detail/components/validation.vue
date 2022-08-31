<template>
	<div>
		<v-notice type="info">
			{{
				t('validation_for_role', {
					action: t(permission.action).toLowerCase(),
					role: role ? role.name : t('public_label'),
				})
			}}
		</v-notice>

		<v-form v-model="permissionSync" :fields="fields" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { Permission, Role } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	props: {
		permission: {
			type: Object as PropType<Permission>,
			required: true,
		},
		role: {
			type: Object as PropType<Role>,
			default: null,
		},
	},
	emits: ['update:permission'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const permissionSync = useSync(props, 'permission', emit);

		const fields = computed(() => [
			{
				field: 'validation',
				name: t('rule'),
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: permissionSync.value.collection,
						includeValidation: true,
						includeRelations: false,
					},
				},
			},
		]);

		return { t, permissionSync, fields };
	},
});
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
