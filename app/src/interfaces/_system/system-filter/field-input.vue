<template>
	<div class="field-input">
        <v-select inline v-model="field.comparator" :items="selectOptions"></v-select>
		<template v-if="['_eq', '_neq', '_lt', '_gt', '_lte','_gte', '_contains', '_ncontains','_starts_with','_nstarts_with', '_ends_with','_nends_with'].includes(field.comparator)">
			<component :is="interfaceType" :value="field.value" @input="field.value = $event"></component>
		</template>
		<template v-else-if="['_in', '_nin'].includes(field.comparator)">
			<interface-input v-for="(val, index) in field.value" :key="val" :value="val" @input="field.value[index] = $event"></interface-input>
			<v-button @click="field.value.push('')">Add</v-button>
		</template>
		<template v-else-if="['_between','_nbetween'].includes(field.comparator)">
			<component :is="interfaceType" :value="val[0]" @input="field.value[0] = $event"></component>
			<component :is="interfaceType" :value="val[1]" @input="field.value[1] = $event"></component>
		</template>
    </div>
</template>

<script lang="ts">
import { Field, filterOperators, FilterOperators } from './system-filter.vue';
import { computed, defineComponent, PropType } from 'vue';
import systemDisplayTemplate from '../system-display-template/system-display-template.vue';
import { useFieldsStore } from '@/stores';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import formatTitle from '@directus/format-title';
import { useI18n } from 'vue-i18n';


export default defineComponent({
    components: { systemDisplayTemplate },
    emits: ['change', 'input'],
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
            required: true
        }
	},
	setup(props) {
		const fieldsStore = useFieldsStore()
		const { t } = useI18n();

		const fieldInfo = computed(() => {
			return fieldsStore.getField(props.collection, props.field.name)
		})

		const selectOptions = computed(() => {
			return getFilterOperatorsForType(fieldInfo.value?.type || 'string').map(type => ({
				text: t(`operators.${type}`),
				value: `_${type}`
			}))
		})

		const interfaceType = computed(() => 'interface-' + getDefaultInterfaceForType(fieldInfo.value?.type || 'string'))
		

		return { selectOptions, fieldInfo, interfaceType };
	},
});
</script>

<style lang="scss" scoped>
.field-input {
	padding: 20px;
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}
</style>
