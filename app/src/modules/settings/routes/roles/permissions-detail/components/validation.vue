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

		<interface-system-filter
			:value="validation"
			:collection-name="permission.collection"
			@input="validation = $event"
		/>
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

		const internalPermission = useSync(props, 'permission', emit);

		const validation = computed({
			get() {
				return internalPermission.value.validation;
			},
			set(newValidation: Record<string, any> | null) {
				internalPermission.value = {
					...internalPermission.value,
					validation: newValidation,
				};
			},
		});

		return { t, validation };
	},
});
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
