<template>
	<div :class="(field.meta && field.meta.width) || 'full'">
		<v-menu attached>
			<template #activator="{ toggle, active }">
				<v-input class="field" :class="{ hidden, active }" readonly @click="openFieldDetail">
					<template #prepend>
						<v-icon class="drag-handle" name="drag_indicator" @click.stop />
					</template>

					<template #input>
						<div class="label">
							<span class="name" v-tooltip="field.name">{{ field.field }}</span>
							<span v-if="field.meta" class="interface">{{ interfaceName }}</span>
							<span v-else class="interface">{{ $t('db_only_click_to_configure') }}</span>
						</div>
					</template>

					<template #append>
						<div class="icons">
							<v-icon
								v-if="field.schema && field.schema.is_primary_key"
								name="vpn_key"
								small
								v-tooltip="$t('primary_key')"
							/>
							<v-icon
								v-if="!field.meta"
								name="report_problem"
								class="unmanaged"
								small
								v-tooltip="$t('db_only_click_to_configure')"
							/>
							<v-icon
								v-if="hidden"
								name="visibility_off"
								class="hidden-icon"
								v-tooltip="$t('hidden_field')"
								small
							/>
							<v-icon @click.stop="toggle" name="more_vert" />
						</div>
					</template>
				</v-input>
			</template>

			<v-list dense>
				<v-list-item :to="`/settings/data-model/${field.collection}/${field.field}`">
					<v-list-item-icon><v-icon name="edit" outline /></v-list-item-icon>
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

				<v-list-item @click="toggleVisibility">
					<template v-if="hidden === false">
						<v-list-item-icon><v-icon name="visibility_off" /></v-list-item-icon>
						<v-list-item-content>{{ $t('hide_field_on_detail') }}</v-list-item-content>
					</template>
					<template v-else>
						<v-list-item-icon><v-icon name="visibility" /></v-list-item-icon>
						<v-list-item-content>{{ $t('show_field_on_detail') }}</v-list-item-content>
					</template>
				</v-list-item>

				<v-divider />

				<v-list-item @click="setWidth('half')" :disabled="field.meta && field.meta.width === 'half'">
					<v-list-item-icon><v-icon name="border_vertical" /></v-list-item-icon>
					<v-list-item-content>{{ $t('half_width') }}</v-list-item-content>
				</v-list-item>

				<v-list-item @click="setWidth('full')" :disabled="field.meta && field.meta.width === 'full'">
					<v-list-item-icon><v-icon name="border_right" /></v-list-item-icon>
					<v-list-item-content>{{ $t('full_width') }}</v-list-item-content>
				</v-list-item>

				<v-list-item @click="setWidth('fill')" :disabled="field.meta && field.meta.width === 'fill'">
					<v-list-item-icon><v-icon name="aspect_ratio" /></v-list-item-icon>
					<v-list-item-content>{{ $t('fill_width') }}</v-list-item-content>
				</v-list-item>

				<v-divider />

				<v-list-item
					@click="deleteActive = true"
					class="danger"
					:disabled="field.schema && field.schema.is_primary_key === true || false"
				>
					<v-list-item-icon><v-icon name="delete" outline /></v-list-item-icon>
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
					<div class="duplicate-field">
						<span class="type-label">{{ $tc('collection', 0) }}</span>
						<v-select class="monospace" :items="collections" v-model="duplicateTo" />
					</div>

					<div class="duplicate-field">
						<span class="type-label">{{ $tc('field', 0) }}</span>
						<v-input class="monospace" v-model="duplicateName" />
					</div>
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
				<v-card-title>{{ $t('delete_field_are_you_sure', { field: field.field }) }}</v-card-title>
				<v-card-actions>
					<v-button @click="deleteActive = false" secondary>{{ $t('cancel') }}</v-button>
					<v-button :loading="deleting" @click="deleteField">{{ $t('delete') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import { Field } from '@/types';
import { useCollectionsStore, useFieldsStore } from '@/stores/';
import { getInterfaces } from '@/interfaces';
import router from '@/router';
import notify from '@/utils/notify';
import { i18n } from '@/lang';

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
	},
	setup(props) {
		const interfaces = getInterfaces();

		const editActive = ref(false);
		const fieldsStore = useFieldsStore();
		const collectionsStore = useCollectionsStore();

		const { deleteActive, deleting, deleteField } = useDeleteField();
		const { duplicateActive, duplicateName, collections, duplicateTo, saveDuplicate, duplicating } = useDuplicate();

		const interfaceName = computed(() => {
			return interfaces.value.find((inter) => inter.id === props.field.meta?.interface)?.name;
		});

		const hidden = computed(() => props.field.meta?.hidden === true);

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
			openFieldDetail,
			hidden,
			toggleVisibility,
		};

		function setWidth(width: string) {
			fieldsStore.updateField(props.field.collection, props.field.field, { meta: { width } });
		}

		function toggleVisibility() {
			fieldsStore.updateField(props.field.collection, props.field.field, {
				meta: { hidden: !props.field.meta?.hidden },
			});
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

				if (newField.meta) {
					delete newField.meta.id;
					delete newField.meta.sort;
				}

				delete newField.name;

				duplicating.value = true;

				try {
					await fieldsStore.createField(duplicateTo.value, newField);

					notify({
						title: i18n.t('field_create_success', { field: newField.name }),
						type: 'success',
					});

					duplicateActive.value = false;
				} catch (error) {
					console.log(error);
				} finally {
					duplicating.value = false;
				}
			}
		}

		async function openFieldDetail() {
			if (!props.field.meta) {
				await fieldsStore.updateField(props.field.collection, props.field.field, { meta: {} });
			}

			router.push(`/settings/data-model/${props.field.collection}/${props.field.field}`);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

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
	--v-icon-color-hover: var(--foreground);

	&.hidden-icon {
		--v-icon-color-hover: var(--foreground-subdued);
	}

	&.unmanaged {
		--v-icon-color: var(--warning);
		--v-icon-color-hover: var(--warning);
	}
}

.drag-handle {
	cursor: grab !important;
}

.duplicate {
	.type-label {
		margin-bottom: 4px;
	}

	.duplicate-field + .duplicate-field {
		margin-bottom: 32px;
	}
}

.field {
	.label {
		flex-grow: 1;

		.name {
			font-family: var(--family-monospace);
		}

		.interface {
			display: none;
			margin-left: 4px;
			color: var(--foreground-subdued);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);

			@include breakpoint(small) {
				display: initial;
			}
		}
	}

	&:hover {
		.label {
			.interface {
				opacity: 1;
			}
		}
	}
}

.v-list-item.danger {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.icons {
	.v-icon + .v-icon:not(:last-child) {
		margin-left: 8px;
	}
}
</style>
