<template>
	<div>
		<v-modal-heading
			:heading="
				$t('validation_for_role', {
					action: $t(permission.action).toLowerCase(),
					role: role ? role.name : $t('public'),
				})
			"
		/>
		<interface-code v-model="validation" language="json" type="json" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Permission, Role } from '@/types';
import useSync from '@/composables/use-sync';

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
	setup(props, { emit }) {
		const _permission = useSync(props, 'permission', emit);

		const validation = computed({
			get() {
				return _permission.value.validation;
			},
			set(newValidation: Record<string, any> | null) {
				_permission.value = {
					..._permission.value,
					validation: newValidation,
				};
			},
		});

		return { validation };
	},
});
</script>
