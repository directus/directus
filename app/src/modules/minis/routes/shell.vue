<script setup lang="ts">
import { defineTool } from '@/ai/composables/define-tool';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCardText from '@/components/v-card-text.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VInfo from '@/components/v-info.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { router } from '@/router';
import { unexpectedError } from '@/utils/unexpected-error';
import { isEmpty } from 'lodash';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';
import AppNavigation from '../components/app-navigation.vue';
import { createSandbox, injectScopedCss, type ErrorEntry, type LogEntry } from '@/utils/minis/sandbox';
import VMinis, { type RenderWarning } from '@/components/v-minis.vue';
import { useMinis } from '../composables/use-minis';

const props = defineProps<{
	appId: string;
}>();

const { t } = useI18n();
const { minis, loading: minisLoading, fetchMinis } = useMinis();

const appIdRef = toRef(props, 'appId');

const {
	item: miniApp,
	loading,
	error,
	getItem: fetchMiniApp,
	save: updateMiniApp,
	edits,
	validationErrors,
} = useItem(ref('directus_minis'), appIdRef);

const hasEdits = computed(() => !isEmpty(edits.value));

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits, {
	ignorePrefix: computed(() => `/minis/${props.appId}`),
});

const discardAndLeave = () => {
	if (!leaveTo.value) return;
	cancelChanges(true);
	confirmLeave.value = false;
	router.push(leaveTo.value);
};

// Edit mode state
const editMode = ref(false);
const livePreview = ref(true); // When in edit mode, show live preview by default

// Testing mode state (for AI to test changes without saving)
const testingMode = ref(false);
const testingValues = ref<{ ui_schema?: any; script?: string; css?: string } | null>(null);

// Flag to prevent race conditions during sandbox initialization
const isInitializingSandbox = ref(false);

// Sandbox state
const sandboxState = ref<Record<string, any>>({});
const sandboxActions = ref<Record<string, (...args: any[]) => any>>({});
const sandboxError = ref<Error | null>(null);
const sandboxLogs = ref<LogEntry[]>([]);
const sandboxErrors = ref<ErrorEntry[]>([]);
const sandboxLoading = ref(false);

// Render warnings (from v-minis.vue)
const renderWarnings = ref<RenderWarning[]>([]);
const MAX_RENDER_WARNINGS = 50; // Limit to prevent memory issues

/**
 * Handle warnings from the schema renderer.
 * These are surfaced to the AI debugging tools.
 */
function handleRenderWarning(warning: RenderWarning): void {
	// Avoid duplicates by checking if we already have this exact warning
	const isDuplicate = renderWarnings.value.some(
		(w) => w.type === warning.type && w.message === warning.message && w.component === warning.component,
	);

	if (!isDuplicate) {
		renderWarnings.value.push(warning);

		// Keep only the most recent warnings
		if (renderWarnings.value.length > MAX_RENDER_WARNINGS) {
			renderWarnings.value = renderWarnings.value.slice(-MAX_RENDER_WARNINGS);
		}
	}
}

// Cleanup functions
let cleanupCss: (() => void) | null = null;
let cleanupSandbox: (() => void) | null = null;

const { updateAllowed, deleteAllowed } = useCollectionPermissions('directus_minis');

onMounted(async () => {
	await fetchMinis();
	await fetchMiniApp();
});

// Re-fetch app when appId changes (navigation between apps)
watch(
	() => props.appId,
	async (newId, oldId) => {
		if (newId && newId !== oldId) {
			// Reset state for new app
			editMode.value = false;
			testingMode.value = false;
			testingValues.value = null;
			sandboxState.value = {};
			sandboxActions.value = {};
			sandboxError.value = null;

			// Cleanup previous resources
			if (cleanupCss) {
				cleanupCss();
				cleanupCss = null;
			}

			if (cleanupSandbox) {
				cleanupSandbox();
				cleanupSandbox = null;
			}

			await fetchMiniApp();
		}
	},
);

// Initialize sandbox when app loads or changes
watch(
	miniApp,
	(newApp) => {
		// Don't reinitialize during testing mode, edit mode, or if already initializing
		if (newApp && !editMode.value && !testingMode.value && !isInitializingSandbox.value) {
			initializeSandbox();
		}
	},
	{ immediate: true },
);

// Cleanup on unmount
onUnmounted(() => {
	if (cleanupCss) {
		cleanupCss();
	}

	if (cleanupSandbox) {
		cleanupSandbox();
	}
});

async function initializeSandbox() {
	if (!miniApp.value || isInitializingSandbox.value) return;

	isInitializingSandbox.value = true;

	// Cleanup previous CSS
	if (cleanupCss) {
		cleanupCss();
	}

	// Cleanup previous sandbox
	if (cleanupSandbox) {
		cleanupSandbox();
		cleanupSandbox = null;
	}

	// Reset state
	sandboxState.value = {};
	sandboxActions.value = {};
	sandboxError.value = null;
	sandboxLogs.value = [];
	sandboxErrors.value = [];
	renderWarnings.value = [];
	sandboxLoading.value = true;

	try {
		// Inject scoped CSS
		cleanupCss = injectScopedCss(miniApp.value.id, miniApp.value.css);

		// Create sandbox (async - loads QuickJS WASM)
		const { state, actions, error: sbError, logs, errors, dispose } = await createSandbox(miniApp.value.script);
		sandboxState.value = state;
		sandboxActions.value = actions;
		sandboxError.value = sbError;
		sandboxLogs.value = logs;
		sandboxErrors.value = errors;
		cleanupSandbox = dispose;
	} catch (err) {
		sandboxError.value = err instanceof Error ? err : new Error(String(err));

		sandboxErrors.value.push({
			message: sandboxError.value.message,
			timestamp: Date.now(),
		});

		// eslint-disable-next-line no-console
		console.error('[MiniApp] Sandbox initialization error:', err);
	} finally {
		sandboxLoading.value = false;
		isInitializingSandbox.value = false;
	}
}

/**
 * Apply test changes to the mini-app without saving.
 * Returns debug info about the result.
 */
async function applyTestChanges(changes: { ui_schema?: any; script?: string; css?: string }) {
	if (!miniApp.value) {
		return {
			success: false,
			error: 'No mini-app loaded',
			initError: null,
			runtimeErrors: [],
			recentLogs: [],
			currentState: {},
			availableActions: [],
		};
	}

	// Wait if another initialization is in progress
	if (isInitializingSandbox.value) {
		return {
			success: false,
			error: 'Sandbox initialization already in progress',
			initError: null,
			runtimeErrors: [],
			recentLogs: [],
			currentState: {},
			availableActions: [],
		};
	}

	isInitializingSandbox.value = true;

	// Enter testing mode and edit mode with live preview
	testingMode.value = true;
	editMode.value = true;
	livePreview.value = true; // Show preview immediately
	testingValues.value = changes;

	// Cleanup previous resources
	if (cleanupCss) {
		cleanupCss();
	}

	if (cleanupSandbox) {
		cleanupSandbox();
		cleanupSandbox = null;
	}

	// Reset state
	sandboxState.value = {};
	sandboxActions.value = {};
	sandboxError.value = null;
	sandboxLogs.value = [];
	sandboxErrors.value = [];
	renderWarnings.value = [];
	sandboxLoading.value = true;

	// Merge with saved values
	const testCss = changes.css !== undefined ? changes.css : miniApp.value.css;
	const testScript = changes.script !== undefined ? changes.script : miniApp.value.script;
	const testSchema = changes.ui_schema !== undefined ? changes.ui_schema : miniApp.value.ui_schema;

	try {
		// Inject scoped CSS
		cleanupCss = injectScopedCss(miniApp.value.id, testCss);

		// Create sandbox with test script
		const { state, actions, error: sbError, logs, errors, dispose } = await createSandbox(testScript);
		sandboxState.value = state;
		sandboxActions.value = actions;
		sandboxError.value = sbError;
		sandboxLogs.value = logs;
		sandboxErrors.value = errors;
		cleanupSandbox = dispose;

		// Store the test schema for rendering
		if (changes.ui_schema !== undefined) {
			// We need to update what VMinis sees - store in testingValues
			testingValues.value = { ...testingValues.value, ui_schema: testSchema };
		}

		return {
			success: !sbError,
			message: sbError
				? 'Test changes applied but there was an error'
				: 'Test changes applied successfully. User is now in edit mode with live preview. Use save-mini-app-changes to persist or reset-mini-app to discard.',
			editMode: true,
			testingMode: true,
			livePreview: livePreview.value,
			initError: sbError?.message || null,
			runtimeErrors: errors.map((e) => ({
				message: e.message,
				action: e.action,
				time: new Date(e.timestamp).toISOString(),
			})),
			renderWarnings: renderWarnings.value.map((w) => ({
				type: w.type,
				message: w.message,
				component: w.component,
				time: new Date(w.timestamp).toISOString(),
			})),
			recentLogs: logs.slice(-20).map((l) => ({
				level: l.level,
				message: l.message,
				time: new Date(l.timestamp).toISOString(),
			})),
			currentState: { ...state },
			availableActions: Object.keys(actions),
		};
	} catch (err) {
		sandboxError.value = err instanceof Error ? err : new Error(String(err));

		sandboxErrors.value.push({
			message: sandboxError.value.message,
			timestamp: Date.now(),
		});

		return {
			success: false,
			initError: sandboxError.value.message,
			runtimeErrors: [],
			renderWarnings: [],
			recentLogs: [],
			currentState: {},
			availableActions: [],
		};
	} finally {
		sandboxLoading.value = false;
		isInitializingSandbox.value = false;
	}
}

/**
 * Reset to the saved version of the mini-app, exiting edit mode.
 */
function resetToSaved() {
	testingMode.value = false;
	testingValues.value = null;
	editMode.value = false;
	edits.value = {};
	initializeSandbox();
}

/**
 * Save the current test changes to the database.
 */
async function saveTestChanges() {
	if (!testingMode.value || !testingValues.value || !miniApp.value) return false;

	try {
		// Apply test values to edits
		if (testingValues.value.ui_schema !== undefined) {
			edits.value.ui_schema = testingValues.value.ui_schema;
		}

		if (testingValues.value.script !== undefined) {
			edits.value.script = testingValues.value.script;
		}

		if (testingValues.value.css !== undefined) {
			edits.value.css = testingValues.value.css;
		}

		// Save to database
		await updateMiniApp();

		// Exit testing and edit mode
		testingMode.value = false;
		testingValues.value = null;
		editMode.value = false;

		// Refresh sidebar
		await fetchMinis();

		// Reinitialize with saved values
		initializeSandbox();

		return true;
	} catch (err) {
		unexpectedError(err);
		return false;
	}
}

function enterEditMode() {
	editMode.value = true;
	livePreview.value = false; // Start with form view
}

const confirmCancel = ref(false);

function cancelChanges(force = false) {
	if (hasEdits.value && force !== true) {
		confirmCancel.value = true;
	} else {
		editMode.value = false;
		edits.value = {};
		confirmCancel.value = false;
	}
}

async function saveApp() {
	try {
		await updateMiniApp();

		editMode.value = false;
		await fetchMinis();

		// Reinitialize sandbox with new values
		initializeSandbox();
	} catch (err) {
		unexpectedError(err);
	}
}

// Delete dialog state
const confirmDelete = ref(false);
const deleting = ref(false);

async function deleteApp() {
	if (deleting.value) return;

	deleting.value = true;

	try {
		await api.delete(`/minis/${props.appId}`);
		router.push('/minis');
	} catch (err) {
		unexpectedError(err);
	} finally {
		deleting.value = false;
		confirmDelete.value = false;
	}
}

const appTitle = computed(() => {
	const name = miniApp.value?.name || 'Loading...';

	if (editMode.value) {
		return t('minis.editing_mini_app', { name });
	}

	return name;
});

const appIcon = computed(() => miniApp.value?.icon || 'apps');

// Whether there are any changes to save (form edits or test changes)
const hasChangesToSave = computed(() => {
	return hasEdits.value || testingMode.value;
});

// Effective schema - uses test values when in testing mode, or form edits when previewing
const effectiveSchema = computed(() => {
	// Testing mode: use test values
	if (testingMode.value && testingValues.value?.ui_schema !== undefined) {
		return testingValues.value.ui_schema;
	}

	// Edit mode with preview: use form edits if available
	if (editMode.value && livePreview.value && edits.value?.ui_schema !== undefined) {
		return edits.value.ui_schema;
	}

	return miniApp.value?.ui_schema;
});

// Effective script - for preview mode
const effectiveScript = computed(() => {
	if (testingMode.value && testingValues.value?.script !== undefined) {
		return testingValues.value.script;
	}

	if (editMode.value && livePreview.value && edits.value?.script !== undefined) {
		return edits.value.script;
	}

	return miniApp.value?.script;
});

// Effective CSS - for preview mode
const effectiveCss = computed(() => {
	if (testingMode.value && testingValues.value?.css !== undefined) {
		return testingValues.value.css;
	}

	if (editMode.value && livePreview.value && edits.value?.css !== undefined) {
		return edits.value.css;
	}

	return miniApp.value?.css;
});

// Reinitialize sandbox when switching to preview mode in edit mode
async function applyPreviewChanges() {
	if (!miniApp.value || !editMode.value) return;

	// Cleanup previous resources
	if (cleanupCss) {
		cleanupCss();
	}

	if (cleanupSandbox) {
		cleanupSandbox();
		cleanupSandbox = null;
	}

	// Reset state
	sandboxState.value = {};
	sandboxActions.value = {};
	sandboxError.value = null;
	sandboxLogs.value = [];
	sandboxErrors.value = [];
	renderWarnings.value = [];
	sandboxLoading.value = true;

	try {
		// Inject scoped CSS with effective values
		cleanupCss = injectScopedCss(miniApp.value.id, effectiveCss.value);

		// Create sandbox with effective script
		const { state, actions, error: sbError, logs, errors, dispose } = await createSandbox(effectiveScript.value);
		sandboxState.value = state;
		sandboxActions.value = actions;
		sandboxError.value = sbError;
		sandboxLogs.value = logs;
		sandboxErrors.value = errors;
		cleanupSandbox = dispose;
	} catch (err) {
		sandboxError.value = err instanceof Error ? err : new Error(String(err));
	} finally {
		sandboxLoading.value = false;
	}
}

// Toggle between form and preview
async function togglePreview() {
	livePreview.value = !livePreview.value;

	if (livePreview.value) {
		// Switching to preview - apply current edits to sandbox
		await applyPreviewChanges();
	}
}

// Register local AI debug tool for this mini-app (available to all users)
defineTool(
	computed(() => ({
		name: `debug-mini-app`,
		displayName: t('minis.debug_mini_app'),
		description: `[CURRENT MINI-APP: "${miniApp.value?.name || 'unknown'}" (ID: ${miniApp.value?.id || 'loading...'})] Debug this mini-app. Returns runtime errors, render warnings, console logs, live state, and the ACTIVE code/schema (including unsaved manual edits). ALWAYS use this tool FIRST when user asks about issues - it knows what the user is currently seeing.`,
		inputSchema: z.object({}),
		execute: () => {
			return {
				miniApp: {
					id: miniApp.value?.id,
					name: miniApp.value?.name,
					status: miniApp.value?.status,
				},
				editMode: editMode.value,
				testingMode: testingMode.value,
				canEdit: updateAllowed.value,
				initError: sandboxError.value?.message || null,
				runtimeErrors: sandboxErrors.value.map((e) => ({
					message: e.message,
					action: e.action,
					time: new Date(e.timestamp).toISOString(),
				})),
				renderWarnings: renderWarnings.value.map((w) => ({
					type: w.type,
					message: w.message,
					component: w.component,
					time: new Date(w.timestamp).toISOString(),
				})),
				recentLogs: sandboxLogs.value.slice(-20).map((l) => ({
					level: l.level,
					message: l.message,
					time: new Date(l.timestamp).toISOString(),
				})),
				currentState: { ...sandboxState.value },
				availableActions: Object.keys(sandboxActions.value),
				activeSchema: effectiveSchema.value,
				activeScript: effectiveScript.value,
				activeCss: effectiveCss.value,
			};
		},
	})),
);

// Register local AI tool to test changes without saving (requires edit permission)
defineTool(
	computed(() => ({
		name: `test-mini-app-changes`,
		displayName: t('minis.test_mini_app_changes'),
		description: updateAllowed.value
			? `[CURRENT MINI-APP: "${miniApp.value?.name || 'unknown'}" (ID: ${miniApp.value?.id || 'loading...'})] Test changes to this mini-app WITHOUT saving. The user will see a live preview. **CRITICAL: NEVER call save-mini-app-changes after this unless the user explicitly asks to "save" or "persist".**`
			: `[UNAVAILABLE - No edit permission] Test changes to the mini-app.`,
		inputSchema: z.object({
			ui_schema: z.any().optional().describe('New UI schema to test (JSON object)'),
			script: z.string().optional().describe('New script code to test'),
			css: z.string().optional().describe('New CSS styles to test'),
		}),
		execute: async (args: { ui_schema?: any; script?: string; css?: string }) => {
			if (!updateAllowed.value) {
				return {
					success: false,
					error: 'Permission denied: You do not have edit access to this mini-app.',
					initError: null,
					runtimeErrors: [],
					recentLogs: [],
					currentState: {},
					availableActions: [],
				};
			}

			const result = await applyTestChanges(args);
			return result;
		},
	})),
);

// Register local AI tool to reset to saved version (requires edit permission)
defineTool(
	computed(() => ({
		name: `reset-mini-app`,
		displayName: t('minis.reset_mini_app'),
		description: updateAllowed.value
			? `[CURRENT MINI-APP: "${miniApp.value?.name || 'unknown'}"] Discard test changes and restore the saved version. Exits edit/testing mode.`
			: `[UNAVAILABLE - No edit permission] Reset the mini-app.`,
		inputSchema: z.object({}),
		execute: () => {
			if (!updateAllowed.value) {
				return { success: false, error: 'Permission denied: You do not have edit access to this mini-app.' };
			}

			resetToSaved();
			return { success: true, message: 'Reset to saved version' };
		},
	})),
);

// Register local AI tool to save test changes (requires edit permission)
defineTool(
	computed(() => ({
		name: `save-mini-app-changes`,
		displayName: t('minis.save_mini_app_changes'),
		description: computed(() => {
			if (!updateAllowed.value) return `[UNAVAILABLE - No edit permission] Save test changes.`;
			if (!testingMode.value) return `[UNAVAILABLE - No test changes to save] Use test-mini-app-changes first.`;
			return `[CURRENT MINI-APP: "${miniApp.value?.name || 'unknown'}" (ID: ${miniApp.value?.id})] Save the currently tested changes. **ONLY call this if the user explicitly asks to "save" or "persist".**`;
		}),
		inputSchema: z.object({}),
		execute: async () => {
			if (!updateAllowed.value) {
				return { success: false, error: 'Permission denied: You do not have edit access to this mini-app.' };
			}

			if (!testingMode.value || !testingValues.value) {
				return { success: false, error: 'No test changes to save. Use test-mini-app-changes first.' };
			}

			const success = await saveTestChanges();
			return { success, message: success ? 'Changes saved successfully' : 'Failed to save changes' };
		},
	})),
);

// Register tool to discover available theme variables
defineTool(
	computed(() => ({
		name: `list-theme-variables`,
		displayName: t('minis.list_theme_variables'),
		description: `[CURRENT ENVIRONMENT] List all active Directus theme variables. Use this to find correct colors, spacing, and border-radius values to make the mini-app match the user's specific theme perfectly.`,
		inputSchema: z.object({}),
		execute: () => {
			const styles = getComputedStyle(document.documentElement);
			const themeVars: Record<string, string> = {};

			// We can't easily iterate all variables on 'styles' as it's a CSSStyleDeclaration,
			// but we can look for specific ones or use a known list from Directus.
			// However, a more robust way is to iterate the stylesheets.
			for (let i = 0; i < document.styleSheets.length; i++) {
				const sheet = document.styleSheets[i];

				try {
					for (let j = 0; j < (sheet?.cssRules.length || 0); j++) {
						const rule = sheet?.cssRules[j];

						if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
							for (let k = 0; k < rule.style.length; k++) {
								const name = rule.style[k];

								if (name?.startsWith('--theme--')) {
									themeVars[name] = styles.getPropertyValue(name).trim();
								}
							}
						}
					}
				} catch {
					// Some stylesheets might be cross-origin
					continue;
				}
			}

			// If we found nothing (rare), return a fallback list of common ones
			if (Object.keys(themeVars).length === 0) {
				const common = [
					'--theme--primary',
					'--theme--secondary',
					'--theme--success',
					'--theme--warning',
					'--theme--danger',
					'--theme--background',
					'--theme--background-normal',
					'--theme--background-subdued',
					'--theme--foreground',
					'--theme--border-radius',
					'--theme--form--column-gap',
					'--theme--form--row-gap',
				];

				for (const v of common) {
					themeVars[v] = styles.getPropertyValue(v).trim();
				}
			}

			return themeVars;
		},
	})),
);
</script>

<template>
	<PrivateView :title="appTitle" :icon="appIcon">
		<template #navigation>
			<AppNavigation :apps="minis" :loading="minisLoading" />
		</template>

		<template #actions>
			<template v-if="!editMode">
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="updateAllowed ? t('edit') : t('not_allowed')"
					:disabled="!updateAllowed || !miniApp"
					secondary
					icon="edit"
					@click="enterEditMode"
				/>

				<VDialog v-model="confirmDelete" @esc="confirmDelete = false">
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							v-tooltip.bottom="deleteAllowed ? t('delete_label') : t('not_allowed')"
							:disabled="!deleteAllowed || !miniApp"
							secondary
							icon="delete"
							class="action-delete"
							@click="on"
						/>
					</template>

					<VCard>
						<VCardTitle>{{ t('minis.delete_mini_app_confirm') }}</VCardTitle>

						<VCardActions>
							<VButton secondary @click="confirmDelete = false">{{ t('cancel') }}</VButton>
							<VButton kind="danger" :loading="deleting" @click="deleteApp">{{ t('delete_label') }}</VButton>
						</VCardActions>
					</VCard>
				</VDialog>
			</template>

			<template v-else>
				<!-- Live preview toggle (available in all edit modes) -->
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="livePreview ? t('minis.show_form') : t('minis.show_preview')"
					secondary
					:icon="livePreview ? 'code' : 'play_arrow'"
					@click="togglePreview"
				/>

				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="t('cancel')"
					secondary
					icon="close"
					@click="cancelChanges()"
				/>
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="hasChangesToSave ? t('save') : t('minis.no_changes')"
					icon="check"
					:disabled="!hasChangesToSave"
					:loading="loading"
					@click="testingMode ? saveTestChanges() : saveApp()"
				/>
			</template>
		</template>

		<VDialog v-model="confirmCancel" @esc="confirmCancel = false" @apply="cancelChanges(true)">
			<VCard>
				<VCardTitle>{{ t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ t('discard_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="cancelChanges(true)">
						{{ t('discard_changes') }}
					</VButton>
					<VButton @click="confirmCancel = false">{{ t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</VButton>

					<VButton @click="confirmLeave = false">{{ t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<!-- Loading state -->
		<div v-if="loading && !miniApp" class="loading-container">
			<VProgressCircular indeterminate />
		</div>

		<!-- Error state -->
		<VInfo v-else-if="error" icon="error" :title="t('minis.error_loading_app')" type="danger" center>
			{{ error.message }}
		</VInfo>

		<!-- Edit mode (form or preview based on toggle) -->
		<div v-else-if="editMode && miniApp" class="edit-container">
			<!-- Testing mode banner (only when AI is testing changes) -->
			<VNotice v-if="testingMode" type="info" class="testing-notice">
				<div class="testing-notice-content">
					<span>{{ t('minis.testing_mode_notice') }}</span>
				</div>
			</VNotice>

			<!-- Preview mode indicator (when viewing local changes) -->
			<VNotice v-if="livePreview && !testingMode && hasEdits" type="info" class="preview-notice">
				<div class="testing-notice-content">
					<span>{{ t('minis.preview_mode_notice') }}</span>
				</div>
			</VNotice>

			<!-- Live preview mode -->
			<div v-if="livePreview" class="mini-app-container" :data-app-id="miniApp.id">
				<VNotice v-if="sandboxError" type="danger" class="sandbox-error">
					<strong>{{ t('minis.sandbox_error', { message: sandboxError.message }) }}</strong>
				</VNotice>

				<div v-if="sandboxLoading" class="sandbox-loading">
					<VProgressCircular indeterminate />
					<span>{{ t('loading') }}</span>
				</div>

				<VMinis
					v-else
					:schema="effectiveSchema"
					:state="sandboxState"
					:actions="sandboxActions"
					:on-warning="handleRenderWarning"
				/>
			</div>

			<!-- Form mode -->
			<div v-else class="edit-form-container">
				<VForm
					v-model="edits"
					collection="directus_minis"
					:primary-key="appId"
					:initial-values="miniApp"
					:validation-errors="validationErrors"
				/>
			</div>
		</div>

		<!-- Normal view mode (not editing) -->
		<div v-else-if="miniApp" class="mini-app-container" :data-app-id="miniApp.id">
			<VNotice v-if="sandboxError" type="danger" class="sandbox-error">
				<strong>{{ t('minis.sandbox_error', { message: sandboxError.message }) }}</strong>
			</VNotice>

			<VNotice v-if="miniApp.status === 'draft'" type="warning" class="draft-notice">
				{{ t('minis.draft_notice') }}
			</VNotice>

			<!-- Sandbox loading state -->
			<div v-if="sandboxLoading" class="sandbox-loading">
				<VProgressCircular indeterminate />
				<span>{{ t('loading') }}</span>
			</div>

			<VMinis
				v-else
				:schema="effectiveSchema"
				:state="sandboxState"
				:actions="sandboxActions"
				:on-warning="handleRenderWarning"
			/>
		</div>

		<!-- Not found -->
		<VInfo v-else icon="apps" :title="t('minis.mini_app_not_found')" center>
			{{ t('minis.mini_app_not_found_copy') }}

			<template #append>
				<VButton @click="router.push('/minis')">{{ t('minis.back_to_minis') }}</VButton>
			</template>
		</VInfo>
	</PrivateView>
</template>

<style scoped lang="scss">
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.loading-container {
	display: flex;
	align-items: center;
	justify-content: center;
	block-size: 400px;
}

.mini-app-container {
	padding: var(--content-padding);
}

.sandbox-error,
.draft-notice,
.testing-notice,
.preview-notice {
	margin-block-end: 16px;
}

.testing-notice-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	inline-size: 100%;
}

.edit-form-container {
	max-inline-size: 1000px;
}

.sandbox-loading {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 40px;
	color: var(--theme--foreground-subdued);
}

.edit-container {
	padding: var(--content-padding);
}

.edit-container .mini-app-container {
	padding: 0;
}

.v-form {
	padding-block-end: var(--content-padding-bottom);
}
</style>
