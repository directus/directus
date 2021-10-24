<template>
	<v-notice v-if="collection === null" class="full" type="warning">
		{{ t('interfaces.list-o2m.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ t('interfaces.select-dropdown-m2o.display_template') }}</p>
			<v-field-template v-model="template" :collection="collection" :depth="1"></v-field-template>
		</div>

		<div class="field full">
			<p class="type-label">{{ t('filter') }}</p>
			<system-filter :value="filter" :collection-name="relatedCollection" @input="filter = $event"></system-filter>
		</div>

		<div class="field half-left">
			<p class="type-label">{{ t('creating_items') }}</p>
			<v-checkbox v-model="enableCreate" block :label="t('enable_create_button')" />
		</div>

		<div class="field half-right">
			<p class="type-label">{{ t('selecting_items') }}</p>
			<v-checkbox v-model="enableSelect" block :label="t('enable_select_button')" />
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field, Relation } from '@directus/shared/types';
import { defineComponent, PropType, computed } from 'vue';
import SystemFilter from '../_system/system-filter/system-filter.vue';

export default defineComponent({
	components: {
		SystemFilter,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		value: {
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const template = computed({
			get() {
				return props.value?.displayTemplate;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					displayTemplate: newTemplate,
				});
			},
		});

		const filter = computed({
			get() {
				return props.value?.filter || null;
			},
			set(newFilters: any) {
				emit('input', {
					...(props.value || {}),
					filter: newFilters,
				});
			},
		});

		const enableCreate = computed({
			get() {
				return props.value?.enableCreate ?? true;
			},
			set(val: boolean) {
				emit('input', {
					...(props.value || {}),
					enableCreate: val,
				});
			},
		});

		const enableSelect = computed({
			get() {
				return props.value?.enableSelect ?? true;
			},
			set(val: boolean) {
				emit('input', {
					...(props.value || {}),
					enableSelect: val,
				});
			},
		});

		const relatedCollection = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			const { field } = props.fieldData;
			const relatedRelation = props.relations.find(
				(relation) => relation.related_collection === props.collection && relation.meta?.one_field === field
			);
			return relatedRelation?.collection || null;
		});

		return { t, template, filter, relatedCollection, enableCreate, enableSelect };
	},
});
</script>
