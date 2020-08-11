<template>
	<div :class="field.meta.width || 'full'">
		<v-menu attached>
			<template #activator="{ toggle, active }">
				<v-input class="field" :class="{ hidden, active }" readonly @click="toggle">
					<template #prepend>
						<v-icon class="drag-handle" name="drag_indicator" @click.stop />
					</template>

					<template #input>
						<div class="name">
							{{ field.name }}
							<span class="interface">{{ interfaceName }}</span>
						</div>
					</template>

					<template #append>
						<v-icon name="expand_more" />
					</template>
				</v-input>
			</template>

			<v-list dense>
				<v-list-item :to="`/settings/data-model/${field.collection}/${field.field}`">
					<v-list-item-icon><v-icon name="edit" /></v-list-item-icon>
					<v-list-item-content>
						{{ $t('edit_field') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item @click="duplicateActive = true">
					<v-list-item-icon>
						<v-icon name="content_copy" />
					</v-list-item-icon>
					<v-list-item-content>{{ $t('duplicate_field') }}</v-list-item-content>
				</v-list-item>
				<v-divider />
				<v-list-item @click="setWidth('half')" :disabled="hidden || field.meta.width === 'half'">
					<v-list-item-icon><v-icon name="border_vertical" /></v-list-item-icon>
					<v-list-item-content>{{ $t('half_width') }}</v-list-item-content>
				</v-list-item>
				<v-list-item @click="setWidth('full')" :disabled="hidden || field.meta.width === 'full'">
					<v-list-item-icon><v-icon name="border_right" /></v-list-item-icon>
					<v-list-item-content>{{ $t('full_width') }}</v-list-item-content>
				</v-list-item>
				<v-list-item @click="setWidth('fill')" :disabled="hidden || field.meta.width === 'fill'">
					<v-list-item-icon><v-icon name="aspect_ratio" /></v-list-item-icon>
					<v-list-item-content>{{ $t('fill_width') }}</v-list-item-content>
				</v-list-item>
				<v-divider />
				<v-list-item @click="$emit('toggle-visibility', field)">
					<template v-if="field.hidden === false">
						<v-list-item-icon><v-icon name="visibility_off" /></v-list-item-icon>
						<v-list-item-content>{{ $t('hide_field_on_detail') }}</v-list-item-content>
					</template>
					<template v-else>
						<v-list-item-icon><v-icon name="visibility" /></v-list-item-icon>
						<v-list-item-content>{{ $t('show_field_on_detail') }}</v-list-item-content>
					</template>
				</v-list-item>

				<v-list-item @click="deleteActive = true">
					<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
					<v-list-item-content>
						{{ $t('delete_field') }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-dialog v-model="duplicateActive">
			<v-card class="duplicate">
				<v-card-title>{{ $t('duplicate_where_to') }}</v-card-title>
				<v-card-text>
					<span class="type-label">{{ $tc('collection', 0) }}</span>
					<v-select class="monospace" :items="collections" v-model="duplicateTo" />

					<span class="type-label">{{ $tc('field', 0) }}</span>
					<v-input class="monospace" v-model="duplicateName" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="duplicateActive = false">
						{{ $t('cancel') }}
					</v-button>
					<v-button @click="saveDuplicate" :loading="duplicating">
						{{ $t('duplicate') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="deleteActive">
			<v-card>
				<v-card-title>Are you sure you want to delete this field?</v-card-title>
				<v-card-actions>
					<v-button @click="deleteActive = false" secondary>Cancel</v-button>
					<v-button :loading="deleting" @click="deleteField">Delete</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import { Field } from '@/types';
import { useCollectionsStore, useFieldsStore } from '@/stores/';
import interfaces from '@/interfaces';

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		hidden: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const editActive = ref(false);
		const fieldsStore = useFieldsStore();
		const collectionsStore = useCollectionsStore();

		const { deleteActive, deleting, deleteField } = useDeleteField();
		const { duplicateActive, duplicateName, collections, duplicateTo, saveDuplicate, duplicating } = useDuplicate();

		const interfaceName = computed(() => {
			return interfaces.find((inter) => inter.id === props.field.meta.interface)?.name;
		});

		return {
			interfaceName,
			editActive,
			setWidth,
			deleteActive,
			deleting,
			deleteField,
			duplicateActive,
			collections,
			duplicateName,
			duplicateTo,
			saveDuplicate,
			duplicating,
		};

		function setWidth(width: string) {
			fieldsStore.updateField(props.field.collection, props.field.field, { system: { width } });
		}

		function useDeleteField() {
			const deleteActive = ref(false);
			const deleting = ref(false);

			return {
				deleteActive,
				deleting,
				deleteField,
			};

			async function deleteField() {
				await fieldsStore.deleteField(props.field.collection, props.field.field);
				deleting.value = false;
				deleteActive.value = false;
			}
		}

		function useDuplicate() {
			const duplicateActive = ref(false);
			const duplicateName = ref(props.field.field + '_copy');
			const duplicating = ref(false);
			const collections = computed(() =>
				collectionsStore.state.collections
					.map(({ collection }) => collection)
					.filter((collection) => collection.startsWith('directus_') === false)
			);
			const duplicateTo = ref(props.field.collection);

			return {
				duplicateActive,
				duplicateName,
				collections,
				duplicateTo,
				saveDuplicate,
				duplicating,
			};

			async function saveDuplicate() {
				const newField = {
					...props.field,
					field: duplicateName.value,
					collection: duplicateTo.value,
				};

				delete newField.meta.id;
				delete newField.meta.sort;
				delete newField.name;

				duplicating.value = true;

				try {
					await fieldsStore.createField(duplicateTo.value, newField);
					duplicateActive.value = false;
				} catch (error) {
					console.log(error);
				} finally {
					duplicating.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
// The default display: contents doens't play nicely with drag and drop
.v-menu {
	display: block;
}

.full,
.fill {
	grid-column: 1 / span 2;
}

.v-input.hidden {
	--background-page: var(--background-subdued);
}

.v-input.monospace {
	--v-input-font-family: var(--family-monospace);
}

.v-select.monospace {
	--v-select-font-family: var(--family-monospace);
}

.v-icon {
	--v-icon-color: var(--foreground-subdued);
}

.drag-handle {
	cursor: grab !important;
}

.duplicate {
	.text-label {
		margin-bottom: 4px;
	}

	.v-select {
		margin-bottom: 32px;
	}
}

.field {
	.name {
		flex-grow: 1;

		.interface {
			margin-left: 4px;
			color: var(--foreground-subdued);
		}
	}
}
</style>
