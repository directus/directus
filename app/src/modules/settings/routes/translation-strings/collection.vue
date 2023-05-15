<template>
	<private-view :title="t('settings_translation_strings')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="translate" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('create_translation_string')" rounded icon @click="openTranslationStringDialog">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_translation_strings_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<div class="translation-strings">
			<v-info v-if="!loading && tableItems.length === 0" icon="translate" :title="t('no_translation_string')" center>
				{{ t('no_translation_string_copy') }}

				<template #append>
					<v-button @click="openTranslationStringDialog">{{ t('create_translation_string') }}</v-button>
				</template>
			</v-info>
			<v-table
				v-else
				:headers="tableHeaders"
				fixed-header
				item-key="key"
				:items="tableItems"
				:loading="loading"
				@click:row="openTranslationStringDialog"
			>
				<template #[`item.key`]="{ item }">
					<span class="key">
						{{ item.key }}
					</span>
				</template>
				<template #[`item.translations`]="{ item }">
					<TranslationStringsTooltip :translations="item.translations" />
				</template>
			</v-table>
		</div>

		<TranslationStringsDrawer
			:model-value="isTranslationStringDialogOpen"
			:translation-string="editingTranslationString"
			@update:model-value="updateTranslationStringsDialog"
		/>
	</private-view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { HeaderRaw as TableHeader } from '@/components/v-table/types';
import SettingsNavigation from '../../components/navigation.vue';
import { TranslationString, useTranslationStrings } from '@/composables/use-translation-strings';
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

const isTranslationStringDialogOpen = ref<boolean>(false);

const editingTranslationString = ref<TranslationString | null>(null);

const { loading, translationStrings } = useTranslationStrings();

const tableItems = computed(() => (translationStrings.value ? translationStrings.value : []));

function openTranslationStringDialog({ item }: { item?: TranslationString }) {
	editingTranslationString.value = item ? item : null;
	isTranslationStringDialogOpen.value = true;
}

function updateTranslationStringsDialog(val: boolean) {
	if (val) return;

	editingTranslationString.value = null;
	isTranslationStringDialogOpen.value = val;
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
</style>
