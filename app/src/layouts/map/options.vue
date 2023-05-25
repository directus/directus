<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.map.basemap') }}</div>
		<v-select v-model="basemap" :items="basemaps.map((s) => ({ text: s.name, value: s.name }))" />
	</div>

	<template v-if="geometryFields.length == 0">
		<div class="field">
			<v-input type="text" disabled :prefix="t('layouts.map.no_compatible_fields')"></v-input>
		</div>
	</template>
	<template v-else>
		<div class="field">
			<div class="type-label">{{ t('layouts.map.field') }}</div>
			<v-select
				v-model="geometryFieldWritable"
				:items="geometryFields.map(({ name, field }) => ({ text: name, value: field }))"
			/>
		</div>
	</template>

	<div class="field">
		<div class="type-label">{{ t('display_template') }}</div>
		<v-field-template
			v-model="displayTemplateWritable"
			:collection="collection"
			:placeholder="t('layouts.map.default_template')"
		/>
	</div>

	<div class="field">
		<v-checkbox
			v-model="clusterDataWritable"
			:label="t('layouts.map.cluster')"
			:disabled="geometryOptions && geometryOptions.geometryType !== 'Point'"
		/>
	</div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import { getBasemapSources } from '@/utils/geometry/basemap';
import { useSync } from '@directus/composables';
import { GeometryOptions, Item } from '@directus/types';
import { toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

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

const { t } = useI18n();

const appStore = useAppStore();

const geometryFieldWritable = useSync(props, 'geometryField', emit);
const clusterDataWritable = useSync(props, 'clusterData', emit);
const displayTemplateWritable = useSync(props, 'displayTemplate', emit);

const basemaps = getBasemapSources();
const { basemap } = toRefs(appStore);
</script>
