<template>
	<private-view :title="t('settings_translation_strings')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="translate" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('create_translation_string')" rounded icon @click="openTranslationStringDrawer">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_translation_strings_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<div class="translation-strings">
			<v-info v-if="!loading && tableItems.length === 0" icon="translate" :title="t('no_translation_string')" center>
				{{ t('no_translation_string_copy') }}

				<template #append>
					<v-button @click="openTranslationStringDrawer">{{ t('create_translation_string') }}</v-button>
				</template>
			</v-info>
			<template v-else>
				<v-table
					:headers="tableHeaders"
					fixed-header
					item-key="key"
					:items="tableItems"
					:loading="loading"
					@click:row="openTranslationStringDrawer"
				>
					<template #[`item.key`]="{ item }">
						<span class="key">
							{{ item.key }}
						</span>
					</template>
					<template #[`item.translations`]="{ item }">
						<TranslationStringsTooltip :translations="item.translations" />
					</template>
					<template #footer>
						<div class="footer">
							<div class="pagination">
								<v-pagination
									v-if="totalPages > 1"
									:length="totalPages"
									:total-visible="7"
									show-first-last
									:model-value="page"
									@update:model-value="toPage"
								/>
							</div>
							<div v-if="loading === false" class="per-page">
								<span>{{ t('per_page') }}</span>
								<v-select
									:model-value="`${limit}`"
									:items="['25', '50', '100', '250', '500', ' 1000']"
									inline
									@update:model-value="limit = +$event"
								/>
							</div>
						</div>
					</template>
				</v-table>
			</template>
		</div>

		<TranslationStringsDrawer
			:model-value="isTranslationStringDrawerOpen"
			:translation-string="editingTranslationString"
			@close-drawer="closeDrawer"
		/>
	</private-view>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { HeaderRaw as TableHeader } from '@/components/v-table/types';
import SettingsNavigation from '../../components/navigation.vue';
import { DisplayTranslationString, useTranslationStrings } from '@/composables/use-translation-strings';
import TranslationStringsDrawer from './translation-strings-drawer.vue';
import TranslationStringsTooltip from './translation-strings-tooltip.vue';

const { t } = useI18n();

const tableHeaders: TableHeader[] = [
	{
		text: t('key'),
		value: 'key',
		sortable: false,
		width: 250,
		align: 'left',
	},
	{
		text: t('translations'),
		value: 'translations',
		sortable: false,
		width: 800,
		align: 'left',
	},
];

const isTranslationStringDrawerOpen = ref<boolean>(false);
const editingTranslationString = ref<DisplayTranslationString | null>(null);
const limit = ref<number>(25);
const page = ref<number>(1);
const loading = ref<boolean>(true);

const { translationKeys, translationStrings, displayTranslationStrings, fetchAllTranslationStrings } =
	useTranslationStrings();

onMounted(() => loadAllTranslations());

const totalPages = computed(() => {
	const keyCount = translationKeys.value?.length ?? 0;
	if (!limit.value) return 0;
	return Math.ceil(keyCount / limit.value);
});

const tableItems = computed(() => {
	if (!displayTranslationStrings.value || !translationKeys.value) return [];
	const offset = (page.value - 1) * limit.value;
	const pageKeys = translationKeys.value.slice(offset, offset + limit.value);
	return displayTranslationStrings.value.filter((ts) => ts.key && pageKeys.includes(ts.key));
});

function openTranslationStringDrawer({ item }: { item?: DisplayTranslationString }) {
	editingTranslationString.value = item ? item : null;
	isTranslationStringDrawerOpen.value = true;
}

function closeDrawer() {
	editingTranslationString.value = null;
	isTranslationStringDrawerOpen.value = false;
}

async function loadAllTranslations() {
	translationStrings.value = await fetchAllTranslationStrings();
	loading.value = false;
}

function toPage(newPage: number) {
	if (newPage < 1) {
		page.value = 1;
	} else if (newPage > totalPages.value) {
		page.value = totalPages.value;
	} else {
		page.value = newPage;
	}
}
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color-disabled: var(--primary-10);
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-hover-disabled: var(--primary-25);
	--v-button-color-hover-disabled: var(--primary);
}
.translation-strings {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}

.search-input {
	--input-height: 44px;

	:deep(.input) {
		border-radius: 22px !important;
	}

	&.active {
		width: 300px;
		border-color: var(--border-normal);

		.icon-empty {
			display: block;
		}
	}
}

.key {
	font-family: var(--family-monospace);
}

.footer {
	position: sticky;
	left: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 32px var(--content-padding);
	.pagination {
		display: inline-block;
	}
	.per-page {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		width: 240px;
		color: var(--foreground-subdued);
		span {
			width: auto;
			margin-right: 4px;
		}
		.v-select {
			color: var(--foreground-normal);
		}
	}
}
</style>
