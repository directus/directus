<template>
	<div>
		<h2 class="type-title" v-if="isNew">{{ $t('relationship_setup_title') }}</h2>
		<v-fancy-select
			:items="items"
			:value="value.type && value.type.toLowerCase()"
			@input="emitValue('type', $event)"
			:disabled="isNew === false"
		/>

		<many-to-one
			v-if="value.type && value.type.toLowerCase() === 'm2o'"
			:collection="value.collection"
			:field="value"
			@update:field="emit('input', $event)"
			:existing-relations="existingRelations"
			:new-relations.sync="_newRelations"
			:is-new="isNew"
		/>
		<one-to-many
			v-else-if="value.type && value.type.toLowerCase() === 'o2m'"
			:collection="value.collection"
			:field="value"
			@update:field="emit('input', $event)"
			:existing-relations="existingRelations"
			:new-relations.sync="_newRelations"
			:is-new="isNew"
		/>
		<many-to-many
			v-else-if="value.type && value.type.toLowerCase() === 'm2m'"
			:collection="value.collection"
			:field="value"
			@update:field="emit('input', $event)"
			:existing-relations="existingRelations"
			:new-relations.sync="_newRelations"
			:is-new="isNew"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch } from '@vue/composition-api';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { Field } from '@/stores/fields/types';
import i18n from '@/lang';
import ManyToOne from './field-setup-relationship-m2o.vue';
import OneToMany from './field-setup-relationship-o2m.vue';
import ManyToMany from './field-setup-relationship-m2m.vue';
import useRelationsStore from '@/stores/relations';
import { Relation } from '@/stores/relations/types';
import useSync from '@/composables/use-sync';

export default defineComponent({
	components: {
		ManyToOne,
		OneToMany,
		ManyToMany,
	},
	props: {
		isNew: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Object as PropType<Field>,
			required: true,
		},
		newRelations: {
			type: Array as PropType<Partial<Relation>[]>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();
		const _newRelations = useSync(props, 'newRelations', emit);

		watch(
			() => props.value.type,
			() => {
				_newRelations.value = [];
			}
		);

		const items = computed<FancySelectItem[]>(() => {
			return [
				{
					text: i18n.t('many_to_one'),
					value: 'm2o',
					icon: 'call_merge',
				},
				{
					text: i18n.t('one_to_many'),
					value: 'o2m',
					icon: 'call_split',
				},
				{
					text: i18n.t('many_to_many'),
					value: 'm2m',
					icon: 'compare_arrows',
				},
			];
		});

		const existingRelations = computed(() => {
			if (props.isNew) return [];
			return relationsStore.getRelationsForField(props.value.collection, props.value.field);
		});

		return { emitValue, items, existingRelations, _newRelations };

		function emitValue(key: string, value: any) {
			emit('input', {
				...props.value,
				[key]: value,
			});
		}
	},
});
</script>
