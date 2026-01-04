<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useItem } from '@/composables/use-item';
import { createSandbox, injectScopedCss, type ErrorEntry, type LogEntry } from '@/utils/minis/sandbox';
import VMinis, { type RenderWarning } from '@/components/v-minis.vue';

const props = defineProps<{
	id: string;
	dashboard: string;
	miniAppId: string | { key: string; collection: string } | null;
	showHeader?: boolean;
	height: number;
	width: number;
}>();

const { t } = useI18n();

const miniAppIdRef = computed(() => {
	if (props.miniAppId && typeof props.miniAppId === 'object') {
		return props.miniAppId.key;
	}

	return props.miniAppId;
});

const { item: miniApp, loading, error } = useItem(ref('directus_minis'), miniAppIdRef);

const friendlyError = computed(() => {
	if (!error.value) return null;

	const status = (error.value as any)?.response?.status;
	const code = (error.value as any)?.extensions?.code;

	if (status === 403 || code === 'FORBIDDEN' || status === 404 || code === 'RECORD_NOT_FOUND') {
		return t('minis.mini_app_not_found_copy');
	}

	return error.value.message;
});

// Sandbox state
const sandboxState = ref<Record<string, any>>({});
const sandboxActions = ref<Record<string, (...args: any[]) => any>>({});
const sandboxError = ref<Error | null>(null);
const sandboxLogs = ref<LogEntry[]>([]);
const sandboxErrors = ref<ErrorEntry[]>([]);
const sandboxLoading = ref(false);

// Render warnings
const renderWarnings = ref<RenderWarning[]>([]);

// Cleanup functions
let cleanupCss: (() => void) | null = null;
let cleanupSandbox: (() => void) | null = null;

async function initializeSandbox() {
	if (!miniApp.value) return;

	// Cleanup previous resources
	if (cleanupCss) {
		cleanupCss();
		cleanupCss = null;
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
		if (miniApp.value.status !== 'published') {
			sandboxLoading.value = false;
			return;
		}

		// Inject scoped CSS
		cleanupCss = injectScopedCss(miniApp.value.id, miniApp.value.css);

		// Create sandbox
		const { state, actions, error: sbError, logs, errors, dispose } = await createSandbox(miniApp.value.script);
		sandboxState.value = state;
		sandboxActions.value = actions;
		sandboxError.value = sbError;
		sandboxLogs.value = logs;
		sandboxErrors.value = errors;
		cleanupSandbox = dispose;
	} catch (err) {
		sandboxError.value = err instanceof Error ? err : new Error(String(err));
		// eslint-disable-next-line no-console
		console.error('[MiniApp Panel] Sandbox initialization error:', err);
	} finally {
		sandboxLoading.value = false;
	}
}

watch(miniApp, (newApp) => {
	if (newApp) {
		initializeSandbox();
	}
}, { immediate: true });

onUnmounted(() => {
	if (cleanupCss) cleanupCss();
	if (cleanupSandbox) cleanupSandbox();
});

function handleRenderWarning(warning: RenderWarning) {
	renderWarnings.value.push(warning);

	if (renderWarnings.value.length > 50) {
		renderWarnings.value = renderWarnings.value.slice(-50);
	}
}
</script>

<template>
	<div class="panel-mini-app" :class="{ 'has-header': showHeader }">
		<VProgressCircular v-if="loading || sandboxLoading" indeterminate />

		<VNotice v-else-if="!miniAppId" type="info" center>
			{{ t('minis.select_mini_app') }}
		</VNotice>

		<VNotice v-else-if="friendlyError" type="danger" center>
			{{ friendlyError }}
		</VNotice>

		<VNotice v-else-if="sandboxError" type="danger" center>
			{{ t('minis.sandbox_error', { message: sandboxError.message }) }}
		</VNotice>

		<VNotice v-else-if="miniApp && miniApp.status !== 'published'" type="warning" center>
			{{ t('minis.draft_notice') }}
		</VNotice>

		<div v-else-if="miniApp" class="mini-app-container" :data-app-id="miniApp.id">
			<VMinis
				:schema="miniApp.ui_schema"
				:state="sandboxState"
				:actions="sandboxActions"
				@warning="handleRenderWarning"
			/>
		</div>
	</div>
</template>

<style scoped>
.panel-mini-app {
	display: flex;
	flex-direction: column;
	inline-size: 100%;
	block-size: 100%;
}

.mini-app-container {
	flex: 1;
	overflow: auto;
	padding: 16px;
}
</style>
