<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { hideDragImage } from '@/utils/hide-drag-image';
import { useCollection } from '@directus/composables';
import { Field, LocalType } from '@directus/types';
import { isNil, orderBy } from 'lodash';
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import FieldSelect from './field-select.vue';

const props = defineProps<{
	collection: string;
}>();

const { t } = useI18n();

const { collection } = toRefs(props);
const { fields } = useCollection(collection);
const fieldsStore = useFieldsStore();

const parsedFields = computed(() => {
	return orderBy(fields.value, [(o) => (o.meta?.sort ? Number(o.meta?.sort) : null), (o) => o.meta?.id]).filter(
		(field) => field.field.startsWith('$') === false
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
			<field-select v-for="field in lockedFields" :key="field.field" disabled :field="field" />
		</div>

		<draggable
			class="field-grid"
			:model-value="usableFields.filter((field) => isNil(field?.meta?.group))"
			force-fallback
			handle=".drag-handle"
			:group="{ name: 'fields' }"
			:set-data="hideDragImage"
			item-key="field"
			:animation="150"
			fallback-on-body
			invert-swap
			@update:model-value="setSort"
		>
			<template #item="{ element }">
				<field-select :field="element" :fields="usableFields" @set-nested-sort="setNestedSort" />
			</template>
		</draggable>

		<v-button full-width :to="`/settings/data-model/${collection}/+`">
			{{ t('create_field') }}
		</v-button>

		<v-menu show-arrow>
			<template #activator="{ toggle, active }">
				<button class="add-field-advanced" :dashed="!active" :class="{ active }" @click="toggle">
					{{ t('create_in_advanced_field_creation_mode') }}
				</button>
			</template>
			<v-list>
				<template v-for="(option, index) in addOptions" :key="index">
					<v-divider v-if="option.divider === true" />
					<v-list-item v-else :to="`/settings/data-model/${collection}/+?type=${option.type}`">
						<v-list-item-icon>
							<v-icon :name="option.icon" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ option.text }}
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 32px 0;
}

.fields-management {
	margin-bottom: 24px;
}

.field-grid {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
	padding-bottom: 24px;
}

.field-select {
	margin: 4px;
}

.field-select:deep(.field-grid) {
	grid-gap: 0;
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

	margin-top: -12px;
}

.add-field-advanced {
	display: block;
	width: max-content;
	margin: 0 auto;
	margin-top: 8px;
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}

.visible {
	margin-bottom: 24px;
}

.list-move {
	transition: transform 0.5s;
}
</style>
