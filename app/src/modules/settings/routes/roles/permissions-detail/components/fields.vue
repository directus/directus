<template>
	<div>
		<v-notice type="info">
			{{
				$t('fields_for_role', {
					role: role ? role.name : $t('public'),
					action: $t(permission.action).toLowerCase(),
				})
			}}
		</v-notice>

		<p class="type-label">{{ $tc('field', 0) }}</p>
		<interface-checkboxes v-model="fields" type="json" :choices="fieldsInCollection" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Permission, Field, Role } from '@/types';
import useSync from '@/composables/use-sync';
import { useFieldsStore } from '@/stores';

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
		const fieldsStore = useFieldsStore();

		const _permission = useSync(props, 'permission', emit);

		const fieldsInCollection = computed(() => {
			const fields = fieldsStore.getFieldsForCollection(props.permission.collection);

			return fields.map((field: Field) => {
				return {
					text: field.name,
					value: field.field,
				};
			});
		});

		const fields = computed({
			get() {
				if (!_permission.value.fields) return [];

				if (_permission.value.fields.includes('*')) {
					return fieldsInCollection.value.map(({ value }: { value: string }) => value);
				}

				return _permission.value.fields;
			},
			set(newFields: string[] | null) {
				if (newFields && newFields.length > 0) {
					if (newFields.length === fieldsInCollection.value.length) {
						_permission.value = {
							..._permission.value,
							fields: ['*'],
						};
					} else {
						_permission.value = {
							..._permission.value,
							fields: newFields,
						};
					}
				} else {
					_permission.value = {
						..._permission.value,
						fields: null,
					};
				}
			},
		});

		return { fields, fieldsInCollection };
	},
});
</script>

<style lang="scss" scoped>
.type-label {
	margin-bottom: 8px;
}

.v-notice {
	margin-bottom: 36px;
}
</style>
