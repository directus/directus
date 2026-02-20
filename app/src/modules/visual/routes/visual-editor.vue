<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { useBreakpoints, useElementHover, useLocalStorage } from '@vueuse/core';
import { computed, type ComputedRef, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AiConversation from '@/ai/components/ai-conversation.vue';
import AiMagicButton from '@/ai/components/ai-magic-button.vue';
import { useAiStore } from '@/ai/stores/use-ai';
import TransitionExpand from '@/components/transition/expand.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { BREAKPOINTS, DRAFT_VERSION_KEY } from '@/constants';
import EditingLayer from '@/modules/visual/components/editing-layer.vue';
import { useVisualEditorUrls } from '@/modules/visual/composables/use-visual-editor-urls';
import type { NavigationData } from '@/modules/visual/types';
import { getUrlRoute } from '@/modules/visual/utils/get-url-route';
import { sameOrigin } from '@/modules/visual/utils/same-origin';
import { analyzeTemplate, extractVersion, matchesTemplate, replaceVersion } from '@/modules/visual/utils/version-url';
import { useServerStore } from '@/stores/server';
import LivePreview from '@/views/private/components/live-preview.vue';
import ModuleBar from '@/views/private/components/module-bar.vue';
import NotificationDialogs from '@/views/private/components/notification-dialogs.vue';
import NotificationsGroup from '@/views/private/components/notifications-group.vue';
import PrivateViewDrawer from '@/views/private/private-view/components/private-view-drawer.vue';

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

const { dynamicDisplay, onNavigation } = usePageInfo();

const { urlTemplates, getUrls } = useVisualEditorUrls();

const { versions, selectedVersion, isVersionSelectable, onVersionSelect } = useVersionSelection();

const urls = computed(() => getUrls(selectedVersion.value?.key ?? 'main'));


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
	const sidebarSize = ref(370);
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

	watch(isMobile, (mobile) => {
		if (mobile) {
			mobileDrawerOpen.value = false;
		}
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

	const isVersionSelectable = computed(() => activeVersionPlacement.value !== null);

	const detectedVersion = computed<ContentVersion['key'] | null | undefined>(() => {
		if (!dynamicUrl || !activeVersionPlacement.value) return undefined;

		const extractedVersion = extractVersion(dynamicUrl, activeVersionPlacement.value);

		return extractedVersion === 'main' ? null : extractedVersion;
	});

	const versions = computed<Pick<ContentVersion, 'key' | 'name'>[]>(() => {
		const versionList = [{ key: DRAFT_VERSION_KEY, name: null }];
		const isDetectedVersionCustom = detectedVersion.value !== null && detectedVersion.value !== DRAFT_VERSION_KEY;

		if (isDetectedVersionCustom) versionList.push({ key: detectedVersion.value!, name: null });

		return versionList.map((version) => ({
			key: version.key,
			name: getVersionDisplayName(version),
		}));
	});

	const selectedVersion = computed(() => {
		if (detectedVersion.value == null) return null;
		return versions.value.find((version) => version.key === detectedVersion.value) ?? null;
	});

	return { versions, selectedVersion, isVersionSelectable, onVersionSelect };

	function onVersionSelect(versionKey: ContentVersion['key'] | null) {
		if (!activeVersionPlacement.value || !dynamicUrl) return;

		const newUrl = replaceVersion(dynamicUrl, activeVersionPlacement.value, versionKey ?? 'main');
		router.replace(getUrlRoute(newUrl));
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
			:header-expanded="moduleBarOpen"
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
				<VButton
					v-tooltip.bottom.end="$t('toggle_navigation')"
					x-small
					rounded
					icon
					secondary
					@click="moduleBarOpen = !moduleBarOpen"
				>
					<VIcon small :name="moduleBarOpen ? 'left_panel_close' : 'left_panel_open'" outline />
				</VButton>

				<VButton
					v-tooltip.bottom.end="$t('toggle_editable_elements')"
					x-small
					rounded
					icon
					:active="showEditableElements"
					secondary
					@click="showEditableElements = !showEditableElements"
				>
					<VIcon small name="edit" outline />
				</VButton>
			</template>

			<template #append-url>
				<VMenu v-if="isVersionSelectable" show-arrow :placement="'bottom'">
					<template #activator="{ toggle, active }">
						<VChip small clickable :label="false" class="version-select-activator" :class="{ active }" @click="toggle">
							{{ selectedVersion?.name ?? $t('main_version') }}
							<VIcon small name="arrow_drop_down"></VIcon>
						</VChip>
					</template>

					<VList>
						<VListItem clickable :active="selectedVersion === null" @click="onVersionSelect(null)">
							<VListItemContent>{{ $t('main_version') }}</VListItemContent>
						</VListItem>
						<VListItem
							v-for="(version, index) in versions"
							:key="index"
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
				<VButton
					v-if="serverStore.info.ai_enabled"
					ref="ai-button"
					v-tooltip.bottom.start="$t('ai_assistant')"
					x-small
					rounded
					icon
					secondary
					:active="isMobile ? mobileDrawerOpen : !sidebarCollapsed"
					@click="isMobile ? (mobileDrawerOpen = !mobileDrawerOpen) : (sidebarCollapsed = !sidebarCollapsed)"
				>
					<AiMagicButton :animate="aiButtonHovering" />
				</VButton>
			</template>

			<template v-if="serverStore.info.ai_enabled && !isMobile" #sidebar>
				<aside class="ai-sidebar">
					<AiConversation />
				</aside>
			</template>

			<template #overlay="{ frameEl, frameSrc }">
				<EditingLayer :frame-src :frame-el :show-editable-elements @navigation="onNavigation" />
			</template>

			<template #notifications>
				<NotificationDialogs />
				<NotificationsGroup />
			</template>
		</LivePreview>

		<PrivateViewDrawer
			v-if="serverStore.info.ai_enabled && isMobile"
			:collapsed="!mobileDrawerOpen"
			placement="right"
			@update:collapsed="mobileDrawerOpen = !$event"
		>
			<aside class="ai-sidebar">
				<AiConversation />
			</aside>
		</PrivateViewDrawer>
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

.ai-sidebar {
	block-size: 100%;
	inline-size: 100%;
	padding: 12px;
	background-color: var(--theme--sidebar--background);
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
	display: flex;
	flex-direction: column;
}
</style>
