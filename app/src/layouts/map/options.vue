<script setup lang="ts">
import VCheckbox from '@/components/v-checkbox.vue';
import VCollectionFieldTemplate from '@/components/v-collection-field-template.vue';
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { getBasemapSources } from '@/utils/geometry/basemap';
import { useSync } from '@directus/composables';
import { useAppStore } from '@directus/stores';
import { GeometryOptions, Item } from '@directus/types';
import { toRefs } from 'vue';

const props = defineProps<{
	collection: string;
	geometryFields: Item[];
	geometryField?: string;
	geometryOptions?: GeometryOptions;
	clusterData?: boolean;
	displayTemplate?: string;
}>();

const emit = defineEmits<{
	(e: 'update:geometryField', geometryField: string): void;
	(e: 'update:clusterData', clusterData: boolean): void;
	(e: 'update:displayTemplate', displayTemplate: string): void;
}>();

const appStore = useAppStore();

const geometryFieldWritable = useSync(props, 'geometryField', emit);
const clusterDataWritable = useSync(props, 'clusterData', emit);
const displayTemplateWritable = useSync(props, 'displayTemplate', emit);

const basemaps = getBasemapSources();
const { basemap } = toRefs(appStore);
</script>

<template>
	<div class="field">
		<div class="type-label">{{ $t('layouts.map.basemap') }}</div>
		<VSelect v-model="basemap" :items="basemaps.map((s) => ({ text: s.name, value: s.name }))" />
	</div>

	<template v-if="geometryFields.length == 0">
		<div class="field">
			<VInput type="text" disabled :prefix="$t('layouts.map.no_compatible_fields')"></VInput>
		</div>
	</template>
	<template v-else>
		<div class="field">
			<div class="type-label">{{ $t('layouts.map.field') }}</div>
			<VSelect
				v-model="geometryFieldWritable"
				:items="geometryFields.map(({ name, field }) => ({ text: name, value: field }))"
			/>
		</div>
	</template>

	<div class="field">
		<div class="type-label">{{ $t('display_template') }}</div>
		<VCollectionFieldTemplate
			v-model="displayTemplateWritable"
			:collection="collection"
			:placeholder="$t('layouts.map.default_template')"
		/>
	</div>

	<div class="field">
		<VCheckbox
			v-model="clusterDataWritable"
			:label="$t('layouts.map.cluster')"
			:disabled="geometryOptions && geometryOptions.geometryType !== 'Point'"
		/>
	</div>
</template>
