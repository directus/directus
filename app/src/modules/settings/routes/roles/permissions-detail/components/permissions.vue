<template>
	<div>
		<v-notice type="info">
			{{
				t('permissions_for_role', {
					action: t(permission.action === 'delete' ? 'delete_label' : permission.action).toLowerCase(),
					role: role ? role.name : t('public_label'),
				})
			}}
		</v-notice>

		<v-form v-model="permissionSync" :fields="fields" />

		<div v-if="appMinimal" class="app-minimal">
			<v-divider />
			<v-notice type="warning">{{ t('the_following_are_minimum_permissions') }}</v-notice>
			<pre class="app-minimal-preview">{{ appMinimal }}</pre>
		</div>
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
		appMinimal: {
			type: Object as PropType<Partial<Permission>>,
			default: undefined,
		},
	},
	emits: ['update:permission'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const permissionSync = useSync(props, 'permission', emit);

		const fields = computed(() => [
			{
				field: 'permissions',
				name: t('rule'),
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: permissionSync.value.collection,
					},
				},
			},
		]);

		return { t, fields, permissionSync };
	},
});
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}

.app-minimal {
	.v-divider {
		margin: 24px 0;
	}

	.v-notice {
		margin-bottom: 24px;
	}

	.app-minimal-preview {
		padding: 16px;
		font-family: var(--family-monospace);
		background-color: var(--background-subdued);
		border-radius: var(--border-radius);
	}
}
</style>
