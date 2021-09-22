<template>
	<v-notice v-if="collection === null" type="warning">
		{{ t('interfaces.list-o2m.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ t('display_template') }}</p>
			<v-field-template v-model="template" :collection="relatedCollection" :depth="2" />
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field, Relation } from '@directus/shared/types';
import { defineComponent, PropType, computed } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<any | null>,
			default: null,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		collection: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const template = computed({
			get() {
				return props.value?.template;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					template: newTemplate,
				});
			},
		});

		const relatedCollection = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			const { field } = props.fieldData;
			const m2o = props.relations.find(
				(relation) => relation.collection === props.collection && relation.field === field
			);
			const o2m = props.relations.find(
				(relation) => relation.related_collection === props.collection && relation.meta?.one_field === field
			);

			if (m2o !== undefined) {
				return m2o?.related_collection || null;
			}

			if (o2m !== undefined) {
				return o2m?.collection || null;
			}

			return null;
		});

		return { t, template, relatedCollection };
	},
});
</script>
