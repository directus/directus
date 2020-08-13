<template>
	<div class="fields-management">
		<draggable
			class="field-grid"
			:value="sortedVisibleFields"
			handle=".drag-handle"
			group="fields"
			@change="($event) => handleChange($event, 'visible')"
			:set-data="hideDragImage"
		>
			<template #header>
				<div class="group-name">{{ $t('visible_fields') }}</div>
			</template>

			<field-select
				v-for="field in sortedVisibleFields"
				:key="field.field"
				:field="field"
				@toggle-visibility="toggleVisibility($event, 'visible')"
			/>
		</draggable>

		<draggable
			class="field-grid hidden"
			:value="sortedHiddenFields"
			handle=".drag-handle"
			group="fields"
			:set-data="hideDragImage"
			@change="($event) => handleChange($event, 'hidden')"
		>
			<template #header>
				<div class="group-name">{{ $t('hidden_fields') }}</div>
			</template>

			<field-select
				v-for="field in sortedHiddenFields"
				:key="field.field"
				:field="field"
				hidden
				@toggle-visibility="toggleVisibility($event, 'hidden')"
				@edit="openFieldSetup(field)"
			/>
		</draggable>

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
				<v-list-item
					v-for="option in addOptions"
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
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs } from '@vue/composition-api';
import useCollection from '@/composables/use-collection/';
import Draggable from 'vuedraggable';
import { Field } from '@/types';
import { useFieldsStore } from '@/stores/';
import FieldSelect from '../field-select/';
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

		const sortedVisibleFields = computed(() =>
			sortBy(
				[...fields.value].filter((field) => field.meta.hidden === false),
				(field) => field.meta.sort || Infinity
			)
		);

		const sortedHiddenFields = computed(() =>
			sortBy(
				[...fields.value].filter((field) => field.meta.hidden === true),
				(field) => field.meta.sort || Infinity
			)
		);

		const addOptions = computed(() => [
			{
				type: 'standard',
				icon: 'create',
				text: i18n.t('standard_field'),
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
			sortedVisibleFields,
			sortedHiddenFields,
			handleChange,
			toggleVisibility,
			hideDragImage,
			addOptions,
		};

		function handleChange(event: DraggableEvent, location: 'visible' | 'hidden') {
			if (event.added !== undefined) {
				addToGroup(event.added, location);
			}

			if (event.moved !== undefined) {
				sortInGroup(event.moved, location);
			}
		}

		function toggleVisibility(field: Field, location: 'visible' | 'hidden') {
			const fields = location === 'hidden' ? sortedVisibleFields.value : sortedHiddenFields.value;

			handleChange(
				{ added: { element: field, newIndex: fields.length } },
				location === 'hidden' ? 'visible' : 'hidden'
			);
		}

		function addToGroup(event: Required<DraggableEvent>['added'], location: 'visible' | 'hidden') {
			/** @NOTE Adding to one group also means removing from the other */

			const { element, newIndex } = event;

			const fieldsInGroup = location === 'visible' ? sortedVisibleFields.value : sortedHiddenFields.value;

			const updates: DeepPartial<Field>[] = fieldsInGroup.slice(newIndex).map((field) => {
				const sortValue =
					field.meta.sort || fieldsInGroup.findIndex((existingField) => existingField.field === field.field);

				return {
					field: field.field,
					sort: sortValue + 1,
				};
			});

			const addedToEnd = newIndex === fieldsInGroup.length;

			let newSortValue = fieldsInGroup[newIndex]?.meta.sort;

			if (!newSortValue && addedToEnd) {
				const previousItem = fieldsInGroup[newIndex - 1];
				if (previousItem && previousItem.meta.sort) newSortValue = previousItem.meta.sort + 1;
			}

			if (!newSortValue) {
				newSortValue = newIndex;
			}

			updates.push({
				field: element.field,
				meta: {
					hidden: location === 'hidden',
					sort: newSortValue,
				},
			});

			fieldsStore.updateFields(element.collection, updates);
		}

		function sortInGroup(event: Required<DraggableEvent>['moved'], location: 'visible' | 'hidden') {
			const { element, newIndex, oldIndex } = event;
			const move = newIndex > oldIndex ? 'down' : 'up';

			const selectionRange = move === 'down' ? [oldIndex + 1, newIndex + 1] : [newIndex, oldIndex];

			const fields = location === 'visible' ? sortedVisibleFields.value : sortedHiddenFields.value;

			const updates: DeepPartial<Field>[] = fields.slice(...selectionRange).map((field) => {
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
	padding-top: 32px;
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);

	.group-name {
		position: absolute;
		top: 6px;
		left: 12px;
		margin-bottom: 8px;
		color: var(--foreground-subdued);
	}
}

.add-field {
	--v-button-font-size: 14px;
	--v-button-background-color: var(--foreground-subdued);
	--v-button-background-color-hover: var(--primary);

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
