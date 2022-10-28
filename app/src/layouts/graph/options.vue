<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.graph.relation') }}</div>
		<v-select
			v-model="relationField"
			:items="relationOptions"
			show-deselect
		/>
	</div>
	<div class="field">
		<div class="type-label">{{ t('layouts.graph.color') }}</div>
		<v-checkbox
			block
			v-model="fixedPositionWritable"
			:label="t('layouts.graph.fixed_positions')"
		/>
	</div>
	<div class="field">
		<div class="type-label">{{ t('layouts.graph.color') }}</div>
		<interface-select-color :value="colorWritable" @input="colorWritable = $event" width="half" />
	</div>
	<div class="field">
		<div class="type-label">{{ t('layouts.graph.size') }}</div>
		<v-slider v-model="sizeWritable" :min="1" :max="20"/>
	</div>
	<div class="field">
		<div class="type-label">{{ t('layouts.graph.collectionsOptions') }}</div>
		<v-list>
			<v-list-item block v-for="collection in props.collectionsForOptions" :key="collection.collection" @click="openCollection = collection.collection">
				{{collection.name}}
			</v-list-item>
		</v-list>
	</div>

	<v-drawer :modelValue="openCollection !== null" @update:modelValue="openCollection = null">
		<v-form :modelValue="collectionsOptions[openCollection!]" :fields="fields" @update:modelValue="updateCollectionOptions" />

	</v-drawer>
</template>

<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useSync } from '@directus/shared/composables';
import { computed, ref, toRefs } from 'vue';
import { useRelationInfo } from './useRelationInfo';
import { cloneDeep } from 'lodash';
import { CollectionOptions } from './types';
import { AppCollection, Collection, DeepPartial, Field } from '@directus/shared/types';
import { useFieldsStore } from '@/stores/fields';

interface Props {
	collection: string,
	relationField: string | null;
	baseColor: string;
	baseSize: number;
	fixedPositions: boolean;
	collectionsOptions: Record<string, CollectionOptions>
	info: Collection | null
	collectionsForOptions: AppCollection[]
	relationOptions: Record<string, string>[]
}

const props = withDefaults(defineProps<Props>(), {
	relationField: null,
	relatedTitles: () => ({})
});

const openCollection = ref<string | null>(null)
const fieldsStore = useFieldsStore()

const emit = defineEmits(['update:relationField','update:baseColor','update:baseSize','update:collectionsOptions','update:fixedPositions']);

const { t } = useI18n();

const relationField = useSync(props, 'relationField', emit)
const colorWritable = useSync(props, 'baseColor', emit);
const sizeWritable = useSync(props, 'baseSize', emit);
const fixedPositionWritable = useSync(props, 'fixedPositions', emit);

function updateCollectionOptions(changes: CollectionOptions) {
	const newCollectionsOptions = cloneDeep(props.collectionsOptions)
	newCollectionsOptions[openCollection.value!] = changes
	emit('update:collectionsOptions', newCollectionsOptions)
}

const fields = computed(() => {
	const collectionInfo = props.collectionsForOptions.find(coll => coll.collection === openCollection.value)

	if(!collectionInfo) {
		openCollection.value = null
		return []
	}

	const fieldsInfo = fieldsStore.getFieldsForCollection(collectionInfo.collection)

	const numberFields = fieldsInfo.filter(field => field.type === 'integer' || field.type === 'decimal' || field.type === 'float' || field.type === 'bigInteger')

	const fields: DeepPartial<Field>[] = [{
		field: 'displayTemplate',
		name: t('layouts.graph.displayTemplate'),
		meta: {
			interface: 'system-display-template',
			options: {
				collectionName: props.collection,
			},
		},
		type: 'string',
	}, {
		field: 'colorField',
		name: t('layouts.graph.colorField'),
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: fieldsInfo.filter(field => field.type === 'string'),
			},
		},
		type: 'string',
	}, {
		field: 'sizeField',
		name: t('layouts.graph.sizeField'),
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: numberFields,
			},
		},
		type: 'string',
	}]

	if(props.fixedPositions) {
		fields.push({
			field: 'xField',
			name: t('layouts.graph.xField'),
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: numberFields,
				},
			},
			type: 'string',
		})
		fields.push({
			field: 'yField',
			name: t('layouts.graph.yField'),
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: numberFields,
				},
			},
			type: 'string',
		})
	}

	return fields
})


</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.nested-options {
	@include form-grid;
}

.v-checkbox {
	width: 100%;

	.spacer {
		flex-grow: 1;
	}
}

.drag-handle {
	--v-icon-color: var(--foreground-subdued);

	cursor: ns-resize;

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}
</style>
