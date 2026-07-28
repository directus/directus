<script setup lang="ts">
import { isPublishedVersionKey, VERSION_KEY_DRAFT, VERSION_KEY_PUBLISHED } from '@directus/constants';
import type { ContentVersion } from '@directus/types';
import { sameOrigin } from '@directus/utils/browser';
import { useHead } from '@unhead/vue';
import { useBreakpoints, useElementHover, useLocalStorage } from '@vueuse/core';
import { isNil } from 'lodash';
import { computed, type ComputedRef, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AiConversation from '@/ai/components/ai-conversation.vue';
import AiMagicButton from '@/ai/components/ai-magic-button.vue';
import { useAiStore } from '@/ai/stores/use-ai';
import TransitionExpand from '@/components/transition/expand.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { BREAKPOINTS } from '@/constants';
import VersionChip from '@/modules/content/components/version-chip.vue';
import EditingLayer from '@/modules/visual/components/editing-layer.vue';
import { useVisualEditorUrls } from '@/modules/visual/composables/use-visual-editor-urls';
import type { NavigationData } from '@/modules/visual/types';
import { getUrlRoute } from '@/modules/visual/utils/get-url-route';
import { analyzeTemplate, extractVersion, matchesTemplate, replaceVersion } from '@/modules/visual/utils/version-url';
import { useServerStore } from '@/stores/server';
import { getVersionDisplayName } from '@/utils/get-version-display-name';
import { unexpectedError } from '@/utils/unexpected-error';
import LivePreviewHeaderButton from '@/views/private/components/live-preview-header-button.vue';
import LivePreview from '@/views/private/components/live-preview.vue';
import ModuleBar from '@/views/private/components/module-bar.vue';
import NotificationDialogs from '@/views/private/components/notification-dialogs.vue';
import NotificationsGroup from '@/views/private/components/notifications-group.vue';
import PrivateViewDrawer from '@/views/private/private-view/components/private-view-drawer.vue';
import { SIDEBAR_DEFAULT_SIZE, SIDEBAR_MIN_SIZE } from '@/views/private/private-view/stores/sidebar';

const { dynamicUrl, invalidUrl } = defineProps<{
	dynamicUrl?: string;
	invalidUrl?: boolean;
}>();

const { t } = useI18n();
const router = useRouter();
const serverStore = useServerStore();
const breakpoints = useBreakpoints(BREAKPOINTS);
const isMobile = breakpoints.smallerOrEqual('sm');

useHead({ title: t('visual_editor') });

const moduleBarOpen = ref(true);
const showEditableElements = ref(false);

const { sidebarSize, sidebarCollapsed, splitterCollapsed, mobileDrawerOpen, aiButtonHovering } = useAiSidebar(isMobile);

const teleportTarget = computed(() => (isMobile.value ? '#ve-sidebar-mobile-outlet' : '#ve-sidebar-desktop-outlet'));

const { dynamicDisplay, onNavigation } = usePageInfo();

const { urlTemplates, resolveUrls } = useVisualEditorUrls();

const { versions, selectedVersion, isVersionSelectable, onVersionSelect, onSwitchVersion } = useVersionSelection();

const urls = computed(() => resolveUrls(selectedVersion.value?.key));

function usePageInfo() {
	const dynamicDisplay = ref<string>();

	return { dynamicDisplay, onNavigation };

	function onNavigation(data: NavigationData) {
		dynamicDisplay.value = data.title;
		router.replace(getUrlRoute(data.url));
	}
}

function onSelectUrl(newUrl: string, oldUrl: string) {
	const differentOrigin = newUrl !== oldUrl && !sameOrigin(newUrl, oldUrl);

	dynamicDisplay.value = undefined;

	if (invalidUrl) {
		router.push(getUrlRoute(newUrl));
	} else if (differentOrigin) {
		window.location.assign(router.resolve(getUrlRoute(newUrl)).href);
	} else {
		router.replace(getUrlRoute(newUrl));
	}
}

function useAiSidebar(isMobile: ComputedRef<boolean>) {
	const aiStore = useAiStore();
	const storedSize = ref(SIDEBAR_DEFAULT_SIZE);
	const enforceDefault = ref(false);

	const sidebarSize = computed({
		get() {
			// Enforce default size when the AI sidebar is below the minimum size
			if (enforceDefault.value && storedSize.value <= SIDEBAR_MIN_SIZE) {
				return SIDEBAR_DEFAULT_SIZE;
			}

			return storedSize.value;
		},
		set(val: number) {
			// Remove default size enforcement once the sidebar is larger than the minimum size
			if (enforceDefault.value && val > SIDEBAR_MIN_SIZE) {
				enforceDefault.value = false;
			}

			storedSize.value = val;
		},
	});

	const sidebarCollapsed = useLocalStorage('visual-editor-ai-sidebar-collapsed', false);
	const mobileDrawerOpen = ref(false);

	const splitterCollapsed = computed({
		get() {
			return isMobile.value ? true : sidebarCollapsed.value;
		},
		set(val: boolean) {
			if (isMobile.value) return;
			sidebarCollapsed.value = val;
		},
	});

	watch(sidebarCollapsed, (isCollapsed) => {
		if (!isCollapsed) enforceDefault.value = true;
	});

	watch(isMobile, () => {
		mobileDrawerOpen.value = false;
	});

	aiStore.onFocusInput(() => {
		if (isMobile.value) {
			mobileDrawerOpen.value = true;
		} else {
			sidebarCollapsed.value = false;
		}
	});

	const aiButtonRef = useTemplateRef<HTMLButtonElement>('ai-button');
	const aiButtonHovering = useElementHover(aiButtonRef);

	return { sidebarSize, sidebarCollapsed, splitterCollapsed, mobileDrawerOpen, aiButtonHovering };
}

function useVersionSelection() {
	const { readAllowed: readVersionsAllowed } = useCollectionPermissions('directus_versions');
	const versionPlacements = computed(() => urlTemplates.value.map(analyzeTemplate));

	const activeVersionPlacement = computed(() => {
		if (!dynamicUrl) return null;

		for (let i = 0; i < urlTemplates.value.length; i++) {
			if (matchesTemplate(urlTemplates.value[i]!, dynamicUrl, versionPlacements.value[i]!)) {
				return versionPlacements.value[i]!;
			}
		}

		return null;
	});

	const isVersionSelectable = computed(() => readVersionsAllowed.value && activeVersionPlacement.value !== null);

	const detectedVersion = computed<ContentVersion['key'] | null | undefined>(() => {
		if (!dynamicUrl || !isVersionSelectable.value) return undefined;

		const extractedVersion = extractVersion(dynamicUrl, activeVersionPlacement.value);

		return isPublishedVersionKey(extractedVersion) ? null : extractedVersion;
	});

	const versions = computed<Pick<ContentVersion, 'key' | 'name'>[]>(() => {
		const versionList = [{ key: VERSION_KEY_DRAFT, name: null }];
		const isDetectedVersionCustom = !isNil(detectedVersion.value) && detectedVersion.value !== VERSION_KEY_DRAFT;

		if (isDetectedVersionCustom) versionList.push({ key: detectedVersion.value!, name: null });

		return versionList.map((version) => ({
			key: version.key,
			name: getVersionDisplayName(version),
		}));
	});

	const selectedVersion = computed(() => {
		if (isNil(detectedVersion.value)) return null;
		return versions.value.find((version) => version.key === detectedVersion.value) ?? null;
	});

	return { versions, selectedVersion, isVersionSelectable, onVersionSelect, onSwitchVersion };

	async function onVersionSelect(versionKey: ContentVersion['key'] | null) {
		if (!activeVersionPlacement.value || !dynamicUrl) return;

		const newUrl = replaceVersion(dynamicUrl, activeVersionPlacement.value, versionKey ?? VERSION_KEY_PUBLISHED);
		await router.replace(getUrlRoute(newUrl));
	}

	async function onSwitchVersion(key: ContentVersion['key'], onSwitched: () => void) {
		try {
			await onVersionSelect(key);
		} catch (error) {
			unexpectedError(error);
		} finally {
			onSwitched();
		}
	}
}
</script>

<template>
	<div class="module">
		<TransitionExpand x-axis>
			<ModuleBar v-if="moduleBarOpen" />
		</TransitionExpand>

		<LivePreview
			:url="urls"
			:invalid-url
			:dynamic-url
			:dynamic-display
			:single-url-subdued="false"
			header-expanded
			:sidebar-size="sidebarSize"
			:sidebar-collapsed="splitterCollapsed"
			:sidebar-disabled="isMobile"
			hide-refresh-button
			hide-popup-button
			centered
			@select-url="onSelectUrl"
			@update:sidebar-size="sidebarSize = $event"
			@update:sidebar-collapsed="splitterCollapsed = $event"
		>
			<template #prepend-header>
				<LivePreviewHeaderButton v-tooltip.bottom.end="$t('toggle_navigation')" @click="moduleBarOpen = !moduleBarOpen">
					<VIcon :name="moduleBarOpen ? 'left_panel_close' : 'left_panel_open'" outline />
				</LivePreviewHeaderButton>

				<LivePreviewHeaderButton
					v-tooltip.bottom.end="$t('toggle_editable_elements')"
					:active="showEditableElements"
					@click="showEditableElements = !showEditableElements"
				>
					<VIcon name="edit" outline />
				</LivePreviewHeaderButton>
			</template>

			<template #append-url>
				<VMenu v-if="isVersionSelectable" show-arrow :placement="'bottom'">
					<template #activator="{ toggle }">
						<VersionChip :version="selectedVersion" @click="toggle()" />
					</template>

					<VList>
						<VListItem clickable :active="selectedVersion === null" @click="onVersionSelect(null)">
							<VListItemContent>{{ $t('published') }}</VListItemContent>
						</VListItem>
						<VListItem
							v-for="version in versions"
							:key="version.key"
							:active="version.key === selectedVersion?.key"
							clickable
							@click="onVersionSelect(version.key)"
						>
							<VListItemContent>{{ version.name }}</VListItemContent>
						</VListItem>
					</VList>
				</VMenu>
			</template>

			<template #append-header>
				<LivePreviewHeaderButton
					v-if="serverStore.info.ai_enabled"
					ref="ai-button"
					v-tooltip.bottom.start="$t('ai_assistant')"
					:active="isMobile ? mobileDrawerOpen : !sidebarCollapsed"
					@click="isMobile ? (mobileDrawerOpen = !mobileDrawerOpen) : (sidebarCollapsed = !sidebarCollapsed)"
				>
					<AiMagicButton class="ai-magic-button" :animate="aiButtonHovering" />
				</LivePreviewHeaderButton>
			</template>

			<template v-if="serverStore.info.ai_enabled" #sidebar>
				<div id="ve-sidebar-desktop-outlet" class="sidebar-outlet sidebar-border" />
			</template>

			<template #overlay="{ frameEl, frameSrc }">
				<EditingLayer
					:frame-src
					:frame-el
					:show-editable-elements
					:version="selectedVersion"
					@navigation="onNavigation"
					@switch-version="onSwitchVersion"
				/>
			</template>

			<template #notifications>
				<NotificationDialogs />
				<NotificationsGroup />
			</template>
		</LivePreview>

		<PrivateViewDrawer
			v-if="serverStore.info.ai_enabled"
			:collapsed="!mobileDrawerOpen"
			placement="right"
			keep-mounted
			@update:collapsed="mobileDrawerOpen = !$event"
		>
			<div id="ve-sidebar-mobile-outlet" class="sidebar-outlet" />
		</PrivateViewDrawer>

		<Teleport v-if="serverStore.info.ai_enabled" defer :to="teleportTarget">
			<aside class="ai-sidebar">
				<AiConversation />
			</aside>
		</Teleport>
	</div>
</template>

<style scoped lang="scss">
.module {
	position: relative;
	display: flex;
	block-size: 100%;
	inline-size: 100%;
	overflow: hidden;
}

.sidebar-outlet {
	block-size: 100%;
	inline-size: 100%;
}

.sidebar-border {
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
}

.ai-magic-button {
	block-size: 1.25rem;
	inline-size: 1.25rem;
}

.ai-sidebar {
	block-size: 100%;
	inline-size: 100%;
	padding: var(--sidebar-section-content-padding);
	background-color: var(--theme--sidebar--background);
	font-family: var(--theme--sidebar--font-family);
	display: flex;
	flex-direction: column;

	/* Border set by parent element; hidden on mobile */
}

.spacer {
	flex: 1;
}
</style>
