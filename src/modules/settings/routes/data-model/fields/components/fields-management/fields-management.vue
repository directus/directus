<template>
	<div class="fields-management">
		<draggable
			class="visible"
			:value="sortedVisibleFields"
			handle=".drag-handle"
			group="fields"
			@change="($event) => handleChange($event, 'visible')"
		>
			<field-select
				v-for="field in sortedVisibleFields"
				:key="field.field"
				:field="field"
				@toggle-visibility="toggleVisibility($event, 'visible')"
			/>
		</draggable>

		<v-divider>{{ $t('hidden_detail') }}</v-divider>

		<draggable
			class="hidden"
			:value="sortedHiddenFields"
			handle=".drag-handle"
			group="fields"
			@change="($event) => handleChange($event, 'hidden')"
		>
			<field-select
				v-for="field in sortedHiddenFields"
				:key="field.field"
				:field="field"
				hidden
				@toggle-visibility="toggleVisibility($event, 'hidden')"
			/>
		</draggable>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useCollection from '@/compositions/use-collection/';
import Draggable from 'vuedraggable';
import { Field } from '@/stores/fields/types';
import useFieldsStore from '@/stores/fields/';
import FieldSelect from '../field-select/';
import { sortBy } from 'lodash';

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
		const { fields } = useCollection(props.collection);
		const fieldsStore = useFieldsStore();

		const sortedVisibleFields = computed(() =>
			sortBy(
				[...fields.value].filter(({ hidden_detail }) => hidden_detail === false),
				(field) => field.sort || Infinity
			)
		);

		const sortedHiddenFields = computed(() =>
			sortBy(
				[...fields.value].filter(({ hidden_detail }) => hidden_detail === true),
				(field) => field.sort || Infinity
			)
		);

		return { sortedVisibleFields, sortedHiddenFields, handleChange, toggleVisibility };

		function handleChange(event: DraggableEvent, location: 'visible' | 'hidden') {
			if (event.added !== undefined) {
				addToGroup(event.added, location);
			}

			if (event.moved !== undefined) {
				sortInGroup(event.moved, location);
			}
		}

		function toggleVisibility(field: Field, location: 'visible' | 'hidden') {
			const fields =
				location === 'hidden' ? sortedVisibleFields.value : sortedHiddenFields.value;

			handleChange(
				{ added: { element: field, newIndex: fields.length } },
				location === 'hidden' ? 'visible' : 'hidden'
			);
		}

		function addToGroup(
			event: Required<DraggableEvent>['added'],
			location: 'visible' | 'hidden'
		) {
			/** @NOTE Adding to one group also means removing from the other */

			const { element, newIndex } = event;

			const fieldsInGroup =
				location === 'visible' ? sortedVisibleFields.value : sortedHiddenFields.value;

			const updates: Partial<Field>[] = fieldsInGroup.slice(newIndex).map((field) => {
				const sortValue =
					field.sort ||
					fieldsInGroup.findIndex((existingField) => existingField.field === field.field);

				return {
					field: field.field,
					sort: sortValue + 1,
				};
			});

			const addedToEnd = newIndex === fieldsInGroup.length;

			let newSortValue = fieldsInGroup[newIndex]?.sort;

			if (!newSortValue && addedToEnd) {
				const previousItem = fieldsInGroup[newIndex - 1];
				if (previousItem && previousItem.sort) newSortValue = previousItem.sort + 1;
			}

			if (!newSortValue) {
				newSortValue = newIndex;
			}

			updates.push({
				field: element.field,
				sort: newSortValue,
				hidden_detail: location === 'hidden',
			});

			fieldsStore.updateFields(element.collection, updates);
		}

		function sortInGroup(
			event: Required<DraggableEvent>['moved'],
			location: 'visible' | 'hidden'
		) {
			const { element, newIndex, oldIndex } = event;
			const move = newIndex > oldIndex ? 'down' : 'up';

			const selectionRange =
				move === 'down' ? [oldIndex + 1, newIndex + 1] : [newIndex, oldIndex];

			const fields =
				location === 'visible' ? sortedVisibleFields.value : sortedHiddenFields.value;

			const updates: Partial<Field>[] = fields.slice(...selectionRange).map((field) => {
				// If field.sort isn't set yet, base it on the index of the array. That way, the
				// new sort value will match what's visible on the screen
				const sortValue =
					field.sort ||
					fields.findIndex((existingField) => existingField.field === field.field);

				return {
					field: field.field,
					sort: move === 'down' ? sortValue - 1 : sortValue + 1,
				};
			});

			const sortOfItemOnNewIndex = fields[newIndex].sort || newIndex;
			updates.push({
				field: element.field,
				sort: sortOfItemOnNewIndex,
			});

			fieldsStore.updateFields(element.collection, updates);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: var(--private-view-content-padding) 0;
}

.visible,
.hidden {
	display: grid;
	grid-gap: 24px 36px;
	grid-template-columns: 1fr 1fr;
}

.list-move {
	transition: transform 0.5s;
}
</style>
