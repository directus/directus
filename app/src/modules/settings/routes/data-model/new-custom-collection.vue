<template>
	<v-drawer
		:title="t('creating_new_custom_collection')"
		:model-value="isOpen"
		class="new-collection"
		persistent
		:sidebar-label="t(currentTab[0])"
		@cancel="router.push('/settings/data-model')"
	>
		<template #sidebar>
			<v-tabs v-model="currentTab" vertical>
				<v-tab value="collection_setup">{{ t('collection_setup') }}</v-tab>
			</v-tabs>
		</template>

		<v-tabs-items v-model="currentTab" class="content">
			<v-tab-item value="collection_setup">
				<!-- <v-notice type="info">{{ t('creating_collection_info') }}</v-notice> -->

				<div class="grid">
					<div class="field">
						<div class="type-label">{{ t('type') }}</div>
						<v-select
							v-model="kind"
							:items="[
								{
									text: t('view'),
									value: 'view',
								},
								{
									text: t('materialized_view'),
									value: 'materialized_view',
								},
								{
									text: t('foreign_table'),
									value: 'foreign_table',
								},
							]"
						/>
					</div>
					<div class="field half">
						<div class="type-label">
							{{ t('name') }}
							<v-icon v-tooltip="t('required')" class="required" name="star" sup />
						</div>
						<v-input
							v-model="collectionName"
							autofocus
							class="monospace"
							db-safe
							:placeholder="t('a_unique_table_name')"
						/>
					</div>
					<div class="field half">
						<div class="type-label">{{ t('singleton') }}</div>
						<v-checkbox v-model="singleton" block :label="t('singleton_label')" />
					</div>
					<!-- <v-divider class="full" /> -->
					<div class="field">
						<div class="type-label">{{ t('definition') }}</div>
						<interface-input-code
							:value="definition"
							:line-number="false"
							:alt-options="{ gutters: false }"
							:placeholder="t('enter_raw_value')"
							language="sql"
							type="sql"
							@input="definition = $event"
						>
							<template #append>
								<v-icon
									name="preview"
									outline
									color="var(--primary)"
									clickable
									:title="t('preview')"
									@click="preview"
								/>
							</template>
						</interface-input-code>
						<div v-if="showPreview" class="preview-container" :class="{ 'has-header': showPreviewHeader }">
							<v-table v-model:headers="previewData.headers" :show-resize="true" :items="previewData.items.rows" />
						</div>
					</div>
					<!--
					<div class="field half">
						<div class="type-label">{{ t('primary_key_field') }}</div>
						<v-input v-model="primaryKeyFieldName" class="monospace" db-safe :placeholder="t('a_unique_column_name')" />
					</div>
					<div class="field half">
						<div class="type-label">{{ t('type') }}</div>
						<v-select
							v-model="primaryKeyFieldType"
							:items="[
								{
									text: t('auto_increment_integer'),
									value: 'auto_int',
								},
								{
									text: t('auto_increment_big_integer'),
									value: 'auto_big_int',
								},
								{
									text: t('generated_uuid'),
									value: 'uuid',
								},
								{
									text: t('manual_string'),
									value: 'manual',
								},
							]"
						/>
					</div>
					-->
				</div>
			</v-tab-item>
		</v-tabs-items>

		<template #actions>
			<v-button
				v-if="currentTab[0] === 'collection_setup'"
				v-tooltip.bottom="t('finish_setup')"
				:disabled="!collectionName || collectionName.length === 0"
				:loading="saving"
				icon
				rounded
				@click="save"
			>
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch } from 'vue';
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { useCollectionsStore } from '@/stores/collections';
import { notify } from '@/utils/notify';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useRouter } from 'vue-router';
import { unexpectedError } from '@/utils/unexpected-error';
import { AxiosResponse } from 'axios';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const router = useRouter();

		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const isOpen = useDialogRoute();

		const currentTab = ref(['collection_setup']);

		const collectionName = ref(null);
		const singleton = ref(false);
		const primaryKeyFieldName = ref('id');
		const primaryKeyFieldType = ref<'auto_int' | 'auto_big_int' | 'uuid' | 'manual'>('auto_int');
		const kind = ref<'table' | 'view' | 'materialized_view' | 'foreign_table'>('view');
		const definition = ref('SELECT * FROM existing_table');
		const showPreview = ref(false);
		const previewData = ref<AxiosResponse<any, any>>();

		const saving = ref(false);

		watch(() => singleton.value, setOptionsForSingleton);

		return {
			t,
			router,
			isOpen,
			currentTab,
			save,
			preview,
			primaryKeyFieldName,
			primaryKeyFieldType,
			collectionName,
			saving,
			singleton,
			kind,
			definition,
			showPreview,
			showPreviewHeader: Boolean(previewData.value),
			previewData,
		};

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		function setOptionsForSingleton() {}

		async function preview() {
			const { data } = await api.post(`/collections/preview`, {
				query: definition.value,
			});

			showPreview.value = true;
			previewData.value = data;
		}

		async function save() {
			saving.value = true;

			try {
				await api.post(`/collections`, {
					collection: collectionName.value,
					// fields: [getPrimaryKeyField(), ...getSystemFields()],
					schema: {},
					meta: {
						// sort_field: sortField.value,
						// archive_field: archiveField.value,
						// archive_value: archiveValue.value,
						// unarchive_value: unarchiveValue.value,
						singleton: singleton.value,
						kind: kind.value,
						definition: definition.value,
					},
				});

				const storeHydrations: Promise<void>[] = [];

				storeHydrations.push(collectionsStore.hydrate(), fieldsStore.hydrate());
				await Promise.all(storeHydrations);

				notify({
					title: t('collection_created'),
				});

				router.replace(`/settings/data-model/${collectionName.value}`);
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				saving.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.type-title {
	margin-bottom: 48px;
}

.grid {
	@include form-grid;
}

.system :deep(.v-input .input) {
	color: var(--foreground-subdued);
}

.system :deep(.v-input .active .input) {
	color: var(--foreground-normal);
}

.system .v-icon {
	--v-icon-color: var(--foreground-subdued);
}

.spacer {
	flex-grow: 1;
}

.v-input.monospace {
	--v-input-font-family: var(--family-monospace);
}

.required {
	color: var(--primary);
}

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.v-notice {
	margin-bottom: 36px;
}

.preview-container {
	width: 100%;
	height: 100%;
	overflow-x: auto;
	overflow-y: auto;
}
</style>
