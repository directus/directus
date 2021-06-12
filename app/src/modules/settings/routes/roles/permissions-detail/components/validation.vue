<template>
	<div>
		<v-notice type="info">
			{{
				t('validation_for_role', {
					action: t(permission.action).toLowerCase(),
					role: role ? role.name : t('public'),
				})
			}}
		</v-notice>

		<interface-input-code :value="validation" @input="validation = $event" language="json" type="json" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { Permission, Role } from '@/types';
import useSync from '@/composables/use-sync';

export default defineComponent({
	emits: ['update:permission'],
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
