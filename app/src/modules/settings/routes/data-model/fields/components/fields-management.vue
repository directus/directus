<template>
	<div class="fields-management">
		<draggable
			class="field-grid"
			:value="sortedFields"
			handle=".drag-handle"
			group="fields"
			:set-data="hideDragImage"
			@change="handleChange"
		>
			<field-select v-for="field in sortedFields" :key="field.field" :field="field" />

			<template #footer>
				<v-menu attached>
					<template #activator="{ toggle, active }">
						<v-button
							@click="toggle"
							class="add-field"
							align="left"
							:dashed="!active"
							:class="{ active }"
							outlined
							large
							full-width
						>
							<v-icon name="add" />
							{{ $t('create_field') }}
						</v-button>
					</template>

					<v-list dense>
						<template v-for="(option, index) in addOptions">
							<v-divider v-if="option.divider === true" :key="index" />
							<v-list-item
								v-else
								:key="option.type"
								:to="`/settings/data-model/${collection}/+?type=${option.type}`"
							>
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
			</template>
		</draggable>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs } from '@vue/composition-api';
import useCollection from '@/composables/use-collection/';
import Draggable from 'vuedraggable';
import { Field } from '@/types';
import { useFieldsStore } from '@/stores/';
import FieldSelect from './field-select.vue';
import { sortBy } from 'lodash';
import hideDragImage from '@/utils/hide-drag-image';
import { i18n } from '@/lang';

type DraggableEvent = {
	moved?: {
		element: Field;
		newIndex: number;
		oldIndex: number;
	};
	added?: {
		element: Field;
		newIndex: number;
	};
};

export default defineComponent({
	components: { Draggable, FieldSelect },
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { collection } = toRefs(props);
		const { fields } = useCollection(collection);
		const fieldsStore = useFieldsStore();

		const sortedFields = computed(() => sortBy(fields.value, (field) => field.meta.sort || Infinity));

		const addOptions = computed(() => [
			{
				type: 'standard',
				icon: 'create',
				text: i18n.t('standard_field'),
			},
			{
				type: 'presentation',
				icon: 'scatter_plot',
				text: i18n.t('presentation_and_aliases'),
			},
			{
				divider: true,
			},
			{
				type: 'file',
				icon: 'photo',
				text: i18n.t('single_file'),
			},
			{
				type: 'files',
				icon: 'collections',
				text: i18n.t('multiple_files'),
			},
			{
				divider: true,
			},
			{
				type: 'm2o',
				icon: 'call_merge',
				text: i18n.t('m2o_relationship'),
			},
			{
				type: 'o2m',
				icon: 'call_split',
				text: i18n.t('o2m_relationship'),
			},
			{
				type: 'm2m',
				icon: 'import_export',
				text: i18n.t('m2m_relationship'),
			},
		]);

		return {
			sortedFields,
			handleChange,
			hideDragImage,
			addOptions,
		};

		function handleChange(event: DraggableEvent) {
			if (event.moved !== undefined) {
				sortInGroup(event.moved);
			}
		}

		function sortInGroup(event: Required<DraggableEvent>['moved']) {
			const { element, newIndex, oldIndex } = event;
			const move = newIndex > oldIndex ? 'down' : 'up';

			const selectionRange = move === 'down' ? [oldIndex + 1, newIndex + 1] : [newIndex, oldIndex];

			const fields = sortedFields.value;

			let updates: DeepPartial<Field>[] = fields.slice(...selectionRange).map((field) => {
				// If field.sort isn't set yet, base it on the index of the array. That way, the
				// new sort value will match what's visible on the screen
				const sortValue =
					field.meta.sort || fields.findIndex((existingField) => existingField.field === field.field);

				return {
					field: field.field,
					meta: {
						sort: move === 'down' ? sortValue - 1 : sortValue + 1,
					},
				};
			});

			const sortOfItemOnNewIndex = fields[newIndex].meta.sort || newIndex;

			updates.push({
				field: element.field,
				meta: {
					sort: sortOfItemOnNewIndex,
				},
			});

			updates = updates.map((update) => ({
				...update,
				meta: {
					sort: update.meta?.sort !== undefined && update.meta?.sort !== null ? update.meta.sort + 1 : null,
				},
			}));

			fieldsStore.updateFields(element.collection, updates);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 32px 0;
}

.field-grid {
	position: relative;
	display: grid;
	grid-gap: 12px;
	grid-template-columns: 1fr 1fr;
	margin-bottom: 24px;
	padding: 12px;
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);
}

.add-field {
	--v-button-font-size: 14px;
	--v-button-background-color: var(--foreground-subdued);
	--v-button-background-color-hover: var(--primary);

	grid-column: 1 / span 2;
	max-width: 50%;

	.v-icon {
		margin-right: 8px;
	}

	&.active {
		--v-button-background-color: var(--primary);
	}
}

.visible {
	margin-bottom: 24px;
}

.list-move {
	transition: transform 0.5s;
}
</style>
