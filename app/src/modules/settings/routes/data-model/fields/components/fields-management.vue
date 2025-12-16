<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { useFieldsStore } from '@/stores/fields';
import { hideDragImage } from '@/utils/hide-drag-image';
import { Field, LocalType } from '@directus/types';
import { isNil, orderBy } from 'lodash';
import { computed, onBeforeMount, onBeforeUnmount, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import FieldSelect from './field-select.vue';

const props = defineProps<{
	collection: string;
}>();

const { t } = useI18n();

const { collection } = toRefs(props);
const fieldsStore = useFieldsStore();
onBeforeMount(async () => await fieldsStore.hydrate({ skipTranslation: true }));
onBeforeUnmount(() => fieldsStore.translateFields());

const fields = computed(() => fieldsStore.getFieldsForCollectionSorted(collection.value));

const parsedFields = computed(() => {
	return orderBy(fields.value, [(o) => (o.meta?.sort ? Number(o.meta?.sort) : null), (o) => o.meta?.id]).filter(
		(field) => field.field.startsWith('$') === false,
	);
});

const lockedFields = computed(() => {
	return parsedFields.value.filter((field) => field.meta?.system === true);
});

const usableFields = computed(() => {
	return parsedFields.value.filter((field) => field.meta?.system !== true);
});

const addOptions = computed<Array<{ type: LocalType; icon: string; text: any } | { divider: boolean }>>(() => [
	{
		type: 'standard',
		icon: 'create',
		text: t('standard_field'),
	},
	{
		type: 'presentation',
		icon: 'scatter_plot',
		text: t('presentation_and_aliases'),
	},
	{
		type: 'group',
		icon: 'view_in_ar',
		text: t('field_group'),
	},
	{
		divider: true,
	},
	{
		type: 'file',
		icon: 'photo',
		text: t('single_file'),
	},
	{
		type: 'files',
		icon: 'collections',
		text: t('multiple_files'),
	},
	{
		divider: true,
	},
	{
		type: 'm2o',
		icon: 'call_merge',
		text: t('m2o_relationship'),
	},
	{
		type: 'o2m',
		icon: 'call_split',
		text: t('o2m_relationship'),
	},
	{
		type: 'm2m',
		icon: 'import_export',
		text: t('m2m_relationship'),
	},
	{
		type: 'm2a',
		icon: 'gesture',
		text: t('m2a_relationship'),
	},
	{
		divider: true,
	},
	{
		type: 'translations',
		icon: 'translate',
		text: t('translations'),
	},
]);

async function setSort(fields: Field[]) {
	const updates = fields.map((field, index) => ({
		field: field.field,
		meta: {
			sort: index + 1,
			group: null,
		},
	}));

	await fieldsStore.updateFields(collection.value, updates);
}

async function setNestedSort(updates?: Field[]) {
	updates = (updates || []).filter((val) => isNil(val) === false);

	if (updates.length > 0) {
		await fieldsStore.updateFields(collection.value, updates);
	}
}
</script>

<template>
	<div class="fields-management">
		<div v-if="lockedFields.length > 0" class="field-grid">
			<FieldSelect v-for="field in lockedFields" :key="field.field" disabled :field="field" />
		</div>

		<Draggable
			class="field-grid"
			:model-value="usableFields.filter((field) => isNil(field?.meta?.group))"
			handle=".drag-handle"
			:group="{ name: 'fields' }"
			:set-data="hideDragImage"
			item-key="field"
			:animation="150"
			v-bind="{ 'force-fallback': true, 'fallback-on-body': true, 'invert-swap': true }"
			@update:model-value="setSort"
		>
			<template #item="{ element }">
				<FieldSelect :field="element" :fields="usableFields" @set-nested-sort="setNestedSort" />
			</template>
		</Draggable>

		<VButton full-width :to="`/settings/data-model/${collection}/+`">
			{{ $t('create_field') }}
		</VButton>

		<VMenu show-arrow>
			<template #activator="{ toggle, active }">
				<button class="add-field-advanced" :dashed="!active" :class="{ active }" @click="toggle">
					{{ $t('create_in_advanced_field_creation_mode') }}
				</button>
			</template>
			<VList>
				<template v-for="(option, index) in addOptions" :key="index">
					<VDivider v-if="option.divider === true" />
					<VListItem v-else :to="`/settings/data-model/${collection}/+?type=${option.type}`">
						<VListItemIcon>
							<VIcon :name="option.icon" />
						</VListItemIcon>
						<VListItemContent>
							{{ option.text }}
						</VListItemContent>
					</VListItem>
				</template>
			</VList>
		</VMenu>
	</div>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 32px 0;
}

.fields-management {
	margin-block-end: 24px;
}

.field-grid {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	padding-block-end: 24px;
}

.field-select {
	margin: 4px;
}

.field-select:deep(.field-grid) {
	gap: 0;
}

.field-select:deep(.field-grid.group.full.nested) {
	margin: 4px 0;

	.field-select {
		margin: 4px;
	}
}

.add-field {
	--v-button-font-size: 14px;
	--v-button-background-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-accent);

	margin-block-start: -12px;
}

.add-field-advanced {
	display: block;
	inline-size: max-content;
	margin: 0 auto;
	margin-block-start: 8px;
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}

.visible {
	margin-block-end: 24px;
}

.list-move {
	transition: transform 0.5s;
}
</style>
