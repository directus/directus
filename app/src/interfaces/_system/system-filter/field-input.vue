<template>
	<div class="field-input">
		<template
			v-if="
				[
					'_eq',
					'_neq',
					'_lt',
					'_gt',
					'_lte',
					'_gte',
					'_contains',
					'_ncontains',
					'_starts_with',
					'_nstarts_with',
					'_ends_with',
					'_nends_with',
				].includes(field.comparator)
			"
		>
			<component :is="interfaceType" :type="fieldInfo.type" :value="value" @input="value = $event"></component>
		</template>
		<template v-else-if="['_in', '_nin'].includes(field.comparator)">
			<div v-for="(val, index) in value" :key="index" class="value">
				<component :is="interfaceType" :type="fieldInfo.type" :value="val" @input="value[index] = $event"></component>
				<v-icon name="delete" @click="remove(index)"></v-icon>
			</div>
			<v-button x-small @click="value = [...value, '']">{{ t('interfaces.filter.add_value') }}</v-button>
		</template>
		<div v-else-if="['_between', '_nbetween'].includes(field.comparator)" class="between">
			<component :is="interfaceType" :type="fieldInfo.type" :value="value[0]" @input="value[0] = $event"></component>
			<component :is="interfaceType" :type="fieldInfo.type" :value="value[1]" @input="value[1] = $event"></component>
		</div>
	</div>
</template>

<script lang="ts">
import { Field } from './system-filter.vue';
import { computed, defineComponent, PropType } from 'vue';
import systemDisplayTemplate from '../system-display-template/system-display-template.vue';
import { useFieldsStore } from '@/stores';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	components: { systemDisplayTemplate },
	props: {
		field: {
			type: Object as PropType<Field>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	emits: ['update:field'],
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();
		const { t } = useI18n();

		const fieldInfo = computed(() => {
			return fieldsStore.getField(props.collection, props.field.name);
		});

		const interfaceType = computed(() => {
			if (fieldInfo.value?.type === 'csv') return 'interface-input';
			return 'interface-' + getDefaultInterfaceForType(fieldInfo.value?.type || 'string');
		});

		const value = computed<any | any[]>({
			get() {
				return props.field.value;
			},
			set(newVal) {
				const newField = props.field.value;
				newField.value = newVal;
				emit('update:field', newField);
			},
		});

		return { t, fieldInfo, interfaceType, remove, value };

		function remove(index: number) {
			value.value = value.value.filter((v: any, i: number) => i !== index);
		}
	},
});
</script>

<style lang="scss" scoped>
.field-input > * {
	margin-top: 8px;
}

.value {
	display: flex;
	align-items: center;

	.v-icon {
		margin-left: 12px;
		margin-right: 8px;
		cursor: pointer;
		color: var(--foreground-subdued);

		&:hover {
			color: var(--danger);
		}
	}
}

.between {
	display: flex;
	gap: 20px;
}
</style>
