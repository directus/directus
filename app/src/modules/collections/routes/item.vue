<template>
	<collections-not-found
		v-if="error || (collectionInfo.meta && collectionInfo.meta.singleton === true && primaryKey !== null)"
	/>

	<private-view v-else :title="title">
		<template #title v-if="collectionInfo.meta && collectionInfo.meta.singleton === true">
			<h1 class="type-title">
				{{ collectionInfo.name }}
			</h1>
		</template>

		<template #title v-else-if="isNew === false && collectionInfo.meta && collectionInfo.meta.display_template">
			<v-skeleton-loader class="title-loader" type="text" v-if="loading" />

			<h1 class="type-title" v-else>
				<render-template
					:collection="collectionInfo.collection"
					:item="templateValues"
					:template="collectionInfo.meta.display_template"
				/>
			</h1>
		</template>

		<template #title-outer:prepend>
			<v-button
				v-if="collectionInfo.meta && collectionInfo.meta.singleton === true"
				class="header-icon"
				rounded
				icon
				secondary
				disabled
			>
				<v-icon :name="collectionInfo.icon" />
			</v-button>

			<v-button
				v-else
				class="header-icon"
				rounded
				icon
				secondary
				exact
				v-tooltip.bottom="$t('back')"
				:to="'/collections/' + collection"
			>
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb
				v-if="collectionInfo.meta && collectionInfo.meta.singleton === true"
				:items="[{ name: $t('collections'), to: '/collections' }]"
			/>
			<v-breadcrumb v-else :items="breadcrumb" />
		</template>

		<template #actions>
			<v-dialog v-if="!isNew" v-model="confirmDelete" :disabled="deleteAllowed === false" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						v-tooltip.bottom="deleteAllowed ? $t('delete') : $t('not_allowed')"
						:disabled="item === null || deleteAllowed !== true"
						@click="on"
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="deleteAndQuit" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog
				v-if="collectionInfo.meta && collectionInfo.meta.archive_field && !isNew"
				v-model="confirmArchive"
				@esc="confirmArchive = false"
				:disabled="archiveAllowed === false"
			>
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-archive"
						v-tooltip.bottom="archiveTooltip"
						@click="on"
						:disabled="item === null || archiveAllowed !== true"
						v-if="collectionInfo.meta && collectionInfo.meta.singleton === false"
					>
						<v-icon :name="isArchived ? 'unarchive' : 'archive'" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ isArchived ? $t('unarchive_confirm') : $t('archive_confirm') }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmArchive = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="toggleArchive" class="action-archive" :loading="archiving">
							{{ isArchived ? $t('unarchive') : $t('archive') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				:loading="saving"
				:disabled="isSavable === false || saveAllowed === false"
				v-tooltip.bottom="saveAllowed ? $t('save') : $t('not_allowed')"
				@click="saveAndQuit"
			>
				<v-icon name="check" />

				<template #append-outer>
					<save-options
						v-if="collectionInfo.meta && collectionInfo.meta.singleton !== true && isSavable === true"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@save-as-copy="saveAsCopyAndNavigate"
					/>
				</template>
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>

		<v-form
			ref="form"
			:disabled="isNew ? false : updateAllowed === false"
			:loading="loading"
			:initial-values="item"
			:fields="fields"
			:primary-key="primaryKey || '+'"
			:validation-errors="validationErrors"
			v-model="edits"
		/>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ $t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ $t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ $t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_collections_item'))" />
			</sidebar-detail>
			<revisions-drawer-detail
				v-if="isNew === false && _primaryKey && revisionsAllowed"
				:collection="collection"
				:primary-key="_primaryKey"
				ref="revisionsDrawerDetail"
				@revert="refresh"
			/>
			<comments-sidebar-detail
				v-if="isNew === false && _primaryKey"
				:collection="collection"
				:primary-key="_primaryKey"
			/>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref, onBeforeUnmount, onBeforeMount } from '@vue/composition-api';
import Vue from 'vue';

import CollectionsNavigation from '../components/navigation.vue';
import router from '@/router';
import CollectionsNotFound from './not-found.vue';
import useCollection from '@/composables/use-collection';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail';
import CommentsSidebarDetail from '@/views/private/components/comments-sidebar-detail';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import i18n from '@/lang';
import marked from 'marked';
import useShortcut from '@/composables/use-shortcut';
import { NavigationGuard } from 'vue-router';
import { usePermissions } from '@/composables/use-permissions';
import unsavedChanges from '@/composables/unsaved-changes';

export default defineComponent({
	name: 'collections-item',
	components: {
		CollectionsNavigation,
		CollectionsNotFound,
		RevisionsDrawerDetail,
		CommentsSidebarDetail,
		SaveOptions,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: String,
			default: null,
		},
		singleton: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const form = ref<HTMLElement>();

		const { collection, primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();

		const revisionsDrawerDetail = ref<Vue | null>(null);

		const { info: collectionInfo, defaults, primaryKeyField, isSingleton } = useCollection(collection);

		const {
			isNew,
			edits,
			item,
			saving,
			loading,
			error,
			save,
			remove,
			deleting,
			archive,
			archiving,
			isArchived,
			saveAsCopy,
			refresh,
			validationErrors,
		} = useItem(collection, primaryKey);

		const hasEdits = computed(() => Object.keys(edits.value).length > 0);

		const isSavable = computed(() => {
			if (saveAllowed.value === false) return false;
			if (hasEdits.value === true) return true;

			if (
				!primaryKeyField.value?.schema?.has_auto_increment &&
				!primaryKeyField.value?.meta?.special?.includes('uuid')
			) {
				return !!edits.value?.[primaryKeyField.value.field];
			}

			if (isNew.value === true) {
				return Object.keys(defaults.value).length > 0 || hasEdits.value;
			}

			return hasEdits.value;
		});

		unsavedChanges(isSavable);

		const confirmDelete = ref(false);
		const confirmArchive = ref(false);

		const confirmLeave = ref(false);
		const leaveTo = ref<string | null>(null);

		const templateValues = computed(() => {
			return {
				...(item.value || {}),
				...edits.value,
			};
		});

		const title = computed(() => {
			return isNew.value
				? i18n.t('creating_in', { collection: collectionInfo.value?.name })
				: i18n.t('editing_in', { collection: collectionInfo.value?.name });
		});

		const archiveTooltip = computed(() => {
			if (archiveAllowed.value === false) return i18n.t('not_allowed');
			if (isArchived.value === true) return i18n.t('unarchive');
			return i18n.t('archive');
		});

		useShortcut('meta+s', saveAndStay, form);
		useShortcut('meta+shift+s', saveAndAddNew, form);

		const navigationGuard: NavigationGuard = (to, from, next) => {
			if (hasEdits.value) {
				confirmLeave.value = true;
				leaveTo.value = to.fullPath;
				return next(false);
			}

			return next();
		};

		const { deleteAllowed, archiveAllowed, saveAllowed, updateAllowed, fields, revisionsAllowed } = usePermissions(
			collection,
			item,
			isNew
		);

		const _primaryKey = computed(() => {
			if (isNew.value) return '+';

			if (isSingleton.value) return item.value?.[primaryKeyField.value?.field];

			return props.primaryKey;
		});

		return {
			item,
			loading,
			error,
			isNew,
			edits,
			isSavable,
			hasEdits,
			saving,
			collectionInfo,
			saveAndQuit,
			deleteAndQuit,
			confirmDelete,
			confirmArchive,
			deleting,
			archiving,
			saveAndStay,
			saveAndAddNew,
			saveAsCopyAndNavigate,
			templateValues,
			archiveTooltip,
			breadcrumb,
			title,
			revisionsDrawerDetail,
			marked,
			refresh,
			confirmLeave,
			leaveTo,
			discardAndLeave,
			navigationGuard,
			deleteAllowed,
			saveAllowed,
			archiveAllowed,
			isArchived,
			updateAllowed,
			toggleArchive,
			validationErrors,
			form,
			fields,
			isSingleton,
			_primaryKey,
			revisionsAllowed,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: collectionInfo.value?.name,
					to: `/collections/${props.collection}`,
				},
			]);

			return { breadcrumb };
		}

		async function saveAndQuit() {
			if (isSavable.value === false) return;

			try {
				await save();
				if (props.singleton === false) router.push(`/collections/${props.collection}`);
			} catch {
				// Save shows unexpected error dialog
			}
		}

		async function saveAndStay() {
			if (isSavable.value === false) return;

			try {
				const savedItem: Record<string, any> = await save();

				revisionsDrawerDetail.value?.$data?.refresh?.();

				if (props.primaryKey === '+') {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const newPrimaryKey = savedItem[primaryKeyField.value!.field];
					router.replace(`/collections/${props.collection}/${newPrimaryKey}`);
				}
			} catch {
				// Save shows unexpected error dialog
			}
		}

		async function saveAndAddNew() {
			if (isSavable.value === false) return;

			try {
				await save();

				if (isNew.value === true) {
					refresh();
				} else {
					router.push(`/collections/${props.collection}/+`);
				}
			} catch {
				// Save shows unexpected error dialog
			}
		}

		async function saveAsCopyAndNavigate() {
			try {
				const newPrimaryKey = await saveAsCopy();
				if (newPrimaryKey) router.push(`/collections/${props.collection}/${newPrimaryKey}`);
			} catch {
				// Save shows unexpected error dialog
			}
		}

		async function deleteAndQuit() {
			try {
				await remove();
				router.push(`/collections/${props.collection}`);
			} catch {
				// `remove` will show the unexpected error dialog
			}
		}

		async function toggleArchive() {
			try {
				await archive();

				if (isArchived.value === true) {
					router.push(`/collections/${props.collection}`);
				} else {
					confirmArchive.value = false;
				}
			} catch {
				// `archive` will show the unexpected error dialog
			}
		}

		function discardAndLeave() {
			if (!leaveTo.value) return;
			edits.value = {};
			router.push(leaveTo.value);
		}
	},
	beforeRouteLeave(to, from, next) {
		return (this as any).navigationGuard(to, from, next);
	},
	beforeRouteUpdate(to, from, next) {
		return (this as any).navigationGuard(to, from, next);
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.action-archive {
	--v-button-background-color: var(--warning-25);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-50);
	--v-button-color-hover: var(--warning);
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-color-disabled: var(--foreground-normal);
	--v-button-color-activated: var(--foreground-normal);
}

.v-form {
	padding: calc(var(--content-padding) * 3) var(--content-padding) var(--content-padding);
	padding-bottom: var(--content-padding-bottom);

	@include breakpoint(small) {
		padding: var(--content-padding);
		padding-bottom: var(--content-padding-bottom);
	}
}

.title-loader {
	width: 260px;
}
</style>
