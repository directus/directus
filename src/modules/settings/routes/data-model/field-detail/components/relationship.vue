<template>
	<relationship-m2o
		:collection="collection"
		:field-data="fieldData"
		:relations.sync="_relations"
		:new-fields.sync="_newFields"
		:type="type"
		v-if="type === 'm2o' || type === 'file'"
	/>
	<relationship-o2m
		:collection="collection"
		:field-data="fieldData"
		:relations.sync="_relations"
		:new-fields.sync="_newFields"
		:type="type"
		v-else-if="type === 'o2m'"
	/>
	<relationship-m2m
		:collection="collection"
		:field-data="fieldData"
		:relations.sync="_relations"
		:new-fields.sync="_newFields"
		:type="type"
		v-else-if="type === 'm2m' || type === 'files'"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Relation } from '@/stores/relations/types';
import { Field } from '@/stores/fields/types';
import useSync from '@/composables/use-sync';

import RelationshipM2o from './relationship-m2o.vue';
import RelationshipO2m from './relationship-o2m.vue';
import RelationshipM2m from './relationship-m2m.vue';

export default defineComponent({
	components: {
		RelationshipM2o,
		RelationshipO2m,
		RelationshipM2m,
	},
	props: {
		type: {
			type: String,
			required: true,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			required: true,
		},
		newFields: {
			type: Array as PropType<DeepPartial<Field>[]>,
			required: true,
		},
		fieldData: {
			type: Object,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _relations = useSync(props, 'relations', emit);
		const _newFields = useSync(props, 'newFields', emit);

		return { _relations, _newFields };
	},
});
</script>
