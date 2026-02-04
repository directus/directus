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
import { BREAKPOINTS } from '@/constants';
import EditingLayer from '@/modules/visual/components/editing-layer.vue';
import type { NavigationData } from '@/modules/visual/types';
import { getUrlRoute } from '@/modules/visual/utils/get-url-route';
import { sameOrigin } from '@/modules/visual/utils/same-origin';
import { useServerStore } from '@/stores/server';
import LivePreview from '@/views/private/components/live-preview.vue';
import ModuleBar from '@/views/private/components/module-bar.vue';
import NotificationDialogs from '@/views/private/components/notification-dialogs.vue';
import NotificationsGroup from '@/views/private/components/notifications-group.vue';
import PrivateViewDrawer from '@/views/private/private-view/components/private-view-drawer.vue';

const { dynamicUrl, invalidUrl } = defineProps<{
	urls: string[];
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
