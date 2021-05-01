<template>
	<div :class="(field.meta && field.meta.width) || 'full'">
		<v-input disabled v-if="disabled" class="field">
			<template #prepend>
				<v-icon name="lock" v-tooltip="$t('system_fields_locked')" />
			</template>

			<template #input>
				<div class="label">
					<span class="name">{{ field.field }}</span>
				</div>
			</template>
		</v-input>

		<div v-else-if="localType === 'translations'" class="group">
			<div class="header">
				<v-icon class="drag-handle" name="drag_indicator" />
				<span class="name" v-tooltip="field.name">{{ field.field }}</span>
				<div class="spacer" />
				<v-icon small name="group_work" v-tooltip="$t('fields_group')" />
				<v-menu show-arrow placement="bottom-end">
					<template #activator="{ toggle }">
						<span class="group-options" @click="toggle">
							<v-icon name="more_vert" />
						</span>
					</template>

					<v-list>
						<v-list-item :to="`/settings/data-model/${field.collection}/${field.field}`">
							<v-list-item-icon><v-icon name="edit" outline /></v-list-item-icon>
							<v-list-item-content>
								{{ $t('edit_field') }}
							</v-list-item-content>
						</v-list-item>

						<v-divider />

						<v-list-item @click="deleteActive = true" class="danger">
							<v-list-item-icon><v-icon name="delete" outline /></v-list-item-icon>
							<v-list-item-content>
								{{ $t('delete_field') }}
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>

			<router-link :to="`/settings/data-model/${translationsCollection}`">
				<v-notice type="info" icon="translate">
					<div>{{ $tc('click_to_manage_translated_fields', translationsFieldsCount) }}</div>
					<div class="spacer" />
					<v-icon name="launch" />
				</v-notice>
			</router-link>
		</div>

		<v-input
			v-else
			class="field"
			:class="{ hidden, tab: field.meta.interface == 'tab' }"
			readonly
			@click="openFieldDetail"
		>
			<template #prepend>
				<v-icon class="drag-handle" name="drag_indicator" @click.stop />
			</template>

			<template #input>
				<div class="label" v-tooltip="field.name + ' (' + interfaceName + ')'">
					<span class="name">
						{{ field.field }}
						<v-icon name="star" class="required" sup v-if="field.schema && field.schema.is_nullable === false" />
					</span>
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
					<v-icon v-if="hidden" name="visibility_off" class="hidden-icon" v-tooltip="$t('hidden_field')" small />
					<v-menu show-arrow placement="bottom-end">
						<template #activator="{ toggle }">
							<v-icon @click.stop="toggle" name="more_vert" />
						</template>

						<v-list>
							<v-list-item :to="`/settings/data-model/${field.collection}/${field.field}`">
								<v-list-item-icon><v-icon name="edit" outline /></v-list-item-icon>
								<v-list-item-content>
									{{ $t('edit_field') }}
								</v-list-item-content>
							</v-list-item>

							<v-list-item v-if="duplicable" @click="duplicateActive = true">
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
								:disabled="(field.schema && field.schema.is_primary_key === true) || false"
							>
								<v-list-item-icon><v-icon name="delete" outline /></v-list-item-icon>
								<v-list-item-content>
									{{ $t('delete_field') }}
								</v-list-item-content>
							</v-list-item>
						</v-list>
					</v-menu>
				</div>
			</template>
		</v-input>

		<v-dialog v-model="duplicateActive" @esc="duplicateActive = false">
			<v-card class="duplicate">
				<v-card-title>{{ $t('duplicate_where_to') }}</v-card-title>
				<v-card-text>
					<div class="form-grid">
						<div class="field">
							<span class="type-label">{{ $tc('collection', 0) }}</span>
							<v-select class="monospace" :items="collections" v-model="duplicateTo" />
						</div>

						<div class="field">
							<span class="type-label">{{ $tc('field', 0) }}</span>
							<v-input class="monospace" v-model="duplicateName" db-safe autofocus />
						</div>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="duplicateActive = false">
						{{ $t('cancel') }}
					</v-button>
					<v-button @click="saveDuplicate" :disabled="duplicateName === null" :loading="duplicating">
						{{ $t('duplicate') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="deleteActive" @esc="deleteActive = false">
			<v-card>
				<v-card-title>{{ $t('delete_field_are_you_sure', { field: field.field }) }}</v-card-title>
				<v-card-actions>
					<v-button @click="deleteActive = false" secondary>{{ $t('cancel') }}</v-button>
					<v-button :loading="deleting" @click="deleteField" class="delete">{{ $t('delete') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import { Field, Relation } from '@/types';
import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores/';
import { getInterfaces } from '@/interfaces';
import router from '@/router';
import { i18n } from '@/lang';
import { cloneDeep } from 'lodash';
import { getLocalTypeForField } from '../../get-local-type';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { InterfaceConfig } from '@/interfaces/types';

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const { interfaces } = getInterfaces();

		const editActive = ref(false);

		const { deleteActive, deleting, deleteField } = useDeleteField();
		const {
			duplicateActive,
			duplicateName,
			collections,
			duplicateTo,
			saveDuplicate,
			duplicating,
			duplicable,
		} = useDuplicate();

		const interfaceName = computed(() => {
			return interfaces.value.find((inter: InterfaceConfig) => inter.id === props.field.meta?.interface)?.name;
		});

		const hidden = computed(() => props.field.meta?.hidden === true);

		const localType = computed(() => getLocalTypeForField(props.field.collection, props.field.field));

		const { translationsCollection, translationsFieldsCount } = useTranslations();

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
			localType,
			translationsCollection,
			translationsFieldsCount,
			duplicable,
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

			const duplicable = computed(() => {
				return (
					['o2m', 'm2m', 'm2o', 'files', 'file', 'm2a'].includes(
						getLocalTypeForField(props.field.collection, props.field.field)
					) === false && props.field.schema?.is_primary_key === false
				);
			});

			return {
				duplicateActive,
				duplicateName,
				collections,
				duplicateTo,
				saveDuplicate,
				duplicating,
				duplicable,
			};

			async function saveDuplicate() {
				const newField: Record<string, any> = {
					...cloneDeep(props.field),
					field: duplicateName.value,
					collection: duplicateTo.value,
				};

				if (newField.meta) {
					delete newField.meta.id;
					delete newField.meta.sort;
				}

				if (newField.schema) {
					delete newField.schema.comment;
				}

				delete newField.name;

				duplicating.value = true;

				try {
					await fieldsStore.createField(duplicateTo.value, newField);

					notify({
						title: i18n.t('field_create_success', { field: newField.field }),
						type: 'success',
					});

					duplicateActive.value = false;
				} catch (err) {
					unexpectedError(err);
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

		function useTranslations() {
			const translationsCollection = computed(() => {
				if (localType.value !== 'translations') return null;

				const relation = relationsStore.state.relations.find((relation: Relation) => {
					return relation.one_collection === props.field.collection && relation.one_field === props.field.field;
				});

				if (!relation) return null;

				return relation.many_collection;
			});

			const translationsFieldsCount = computed(() => {
				const fields = fieldsStore.getFieldsForCollection(translationsCollection.value);

				return fields.filter((field: Field) => field.meta?.hidden !== true).length;
			});

			return { translationsCollection, translationsFieldsCount };
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';
@import '@/styles/mixins/form-grid';

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

.group {
	position: relative;
	padding: var(--input-padding);
	background-color: var(--card-face-color);
	border-radius: var(--border-radius);
	box-shadow: 0px 0px 6px 0px rgba(var(--card-shadow-color), 0.2);

	.header {
		display: flex;
		align-items: center;
		margin-bottom: var(--input-padding);
	}

	.name {
		font-family: var(--family-monospace);
	}

	.drag-handle {
		margin-right: 8px;
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--foreground);
		}
	}

	.group-options {
		cursor: pointer;
	}

	.v-notice {
		cursor: pointer;
	}
}

.field {
	--input-height: 48px;
	--input-padding: 8px;

	::v-deep .input {
		background-color: var(--card-face-color);
		border: none;
		box-shadow: 0px 0px 6px 0px rgba(var(--card-shadow-color), 0.2);

		&:hover {
			background-color: var(--card-face-color);
		}
	}
	&.tab {
		::v-deep .input {
			background-color: var(--primary-10);

			&:hover {
				background-color: var (--primary-20);
			}
		}
	}

	.label {
		flex-grow: 1;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;

		.name {
			font-family: var(--family-monospace);
		}

		.interface {
			display: none;
			color: var(--foreground-subdued);
			font-family: var(--family-monospace);
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

.spacer {
	flex-grow: 1;
}

.form-grid {
	--form-vertical-gap: 24px;

	@include form-grid;
}

.delete {
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-125);
}

.required {
	position: relative;
	left: -8px;
	color: var(--primary);
}
</style>
