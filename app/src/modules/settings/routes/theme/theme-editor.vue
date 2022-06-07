<template>
	<private-view :title="t('settings_theme')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon>
				<v-icon name="palette" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('save')" icon rounded :disabled="!hasEdits" :loading="saving" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<theme-selection :current-theme="editingTheme"></theme-selection>

		<div class="theme-options">
			<v-form
				ref="themeForm"
				:model-value="pendingChanges"
				:initial-values="initialValues"
				:fields="themeFields"
				:primary-key="1"
				@update:model-value="updateChanges($event)"
			/>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_theming')" class="page-description" />
			</sidebar-detail>
		</template>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { generateAccent, generateSubtle } from '@/utils/theming';
import SettingsNavigation from '../../components/navigation.vue';
import ThemeSelection from './components/theme-selection.vue';
import { useServerStore, useThemeStore } from '@/stores';
import useShortcut from '@/composables/use-shortcut';
import useEditsGuard from '@/composables/use-edits-guard';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { Field } from '@directus/shared/types';
const { t } = useI18n();

const router = useRouter();
const route = useRoute();

const serverStore = useServerStore();
const themeStore = useThemeStore();

const { editingTheme } = storeToRefs(themeStore);

const initialValues = ref(themeStore.getInitialValues);

const themeFields = ref(themeStore.getFields);

const themeForm = ref<any>(null);

const generatedFields = computed<Field[] | null>(() => {
	return (
		themeFields.value.filter((field) => {
			return field.meta?.options?.generated === true;
		}) || null
	);
});

const generatedFieldDependencies = computed<Record<string, string[]>>(() => {
	if (!generatedFields.value) return {};
	let dependencies: Record<string, any> = {};
	for (const field of generatedFields.value) {
		const options = field.meta?.options;
		if (!options || options === {}) continue;
		if (!dependencies[field.field]) {
			dependencies[field.field] = [];
		}
		if (options.source) {
			dependencies[field.field].push(options.source);
		}
		if (options.backgroundSource) {
			dependencies[field.field].push(options.backgroundSource);
		}
	}
	return dependencies;
});

const pendingChanges = ref<Record<string, any> | null>(null);

const hasEdits = computed(() => pendingChanges.value !== null && Object.keys(pendingChanges.value).length > 0);

const saving = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) save();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

onBeforeRouteLeave(() => {
	themeStore.setEditingTheme('light');
	themeStore.setAppTheme();
	pendingChanges.value = {};
});

watch(
	() => route.params.theme as string,
	(newTheme) => {
		if (!newTheme) return;
		themeStore.setEditingTheme(newTheme);
		themeStore.setAppTheme(newTheme);
		themeStore.populateFonts(newTheme);
		themeFields.value = themeStore.getFields;
		initialValues.value = themeStore.getInitialValues;
		pendingChanges.value = {};
	}
);

function updateChanges(newEdits: Record<string, any>) {
	const toRegenerate = [];
	for (const field of Object.keys(generatedFieldDependencies.value)) {
		const dependencies = generatedFieldDependencies.value[field];
		for (const dep of dependencies) {
			if (
				(newEdits?.[dep] && (!pendingChanges.value || newEdits?.[dep] !== pendingChanges.value[dep])) ||
				(!newEdits?.[dep] && pendingChanges?.value?.[dep])
			) {
				toRegenerate.push(field);
			}
		}
	}

	if ((!pendingChanges.value || pendingChanges.value === {}) && toRegenerate.length > 0) {
		pendingChanges.value = {};
	}

	if (!newEdits) {
		newEdits = {};
	}

	for (const field of toRegenerate) {
		const fieldData = themeFields.value.find((tField) => {
			return tField.field === field;
		});

		if (!fieldData) continue;

		const type = fieldData.meta?.options?.generateType;
		const sourcePath = fieldData.meta?.options?.source || '';
		const backgroundPath = fieldData.meta?.options?.backgroundSource || '';

		if (!sourcePath) continue;

		const sourceValue = newEdits?.[sourcePath] || initialValues.value[sourcePath];
		const backgroundValue = newEdits?.[backgroundPath] || initialValues.value[backgroundPath];

		const generatedColor = generateColor(type, sourceValue, backgroundValue || null);

		if (!generatedColor) continue;

		if (initialValues.value[field].toLowerCase() === generatedColor.toLowerCase()) {
			delete newEdits[field];
		} else {
			newEdits[field] = generatedColor;
		}
	}

	pendingChanges.value = newEdits as Record<string, any>;
}

function generateColor(type: string, source: string, background?: string) {
	// Return early if source is not a valid 3 or 6 character hex value
	if (!source || typeof source !== 'string' || !/^#(([\da-fA-F]{3}){1,2})$/.test(source)) return null;

	let newColor = '#cccccc';
	if (type === 'accent') {
		newColor = generateAccent(source, editingTheme.value === 'dark' ? false : true);
	} else {
		// subtle
		if (!background) {
			return source;
		}
		newColor = generateSubtle(source, background, 0.1, editingTheme.value === 'dark' ? 5 : -5);
	}
	return newColor;
}

async function save() {
	if (pendingChanges.value === {}) return;
	saving.value = true;
	await themeStore.updateThemeOverrides({ [editingTheme.value]: pendingChanges.value });
	initialValues.value = themeStore.getInitialValues;
	await serverStore.hydrate();
	await themeStore.populateStyles();
	await themeStore.populateFonts(editingTheme.value);
	pendingChanges.value = {};
	saving.value = false;
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	pendingChanges.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
</script>

<style lang="scss" scoped>
.theme-options {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
	// .narrow-columns class set in field. Taking advantage of the fact that
	// v-form v-binds all options passed to field.
	:deep(.narrow-columns) {
		& > .grid {
			display: grid;
			grid-template-columns: [start] repeat(auto-fill, [start] minmax(165px, 1fr) [full]) [full];

			& > .full {
				grid-column: auto;
			}
		}
		.group-raw {
			&.theme-color-group {
				& > .grid {
					display: flex;
					flex-wrap: wrap;
					grid-gap: 4px;
					& > .full {
						&.first-visible-field {
							width: 100%;
						}
					}
				}
			}
		}
	}
}

.theme-options,
.theme-selection {
	:deep(.theme-editor-divider) {
		margin-bottom: calc(var(--form-vertical-gap) * -0.618);
		&.large .type-text {
			font-weight: 600;
			font-size: 20px;
		}
	}
}

.theme-selection {
	:deep(.theme-editor-divider) {
		margin-bottom: 0;
	}
}

.header-icon {
	--v-button-color-disabled: var(--g-color-primary-normal);
	--v-button-background-color-disabled: var(--g-color-primary-subtle);
}
</style>
