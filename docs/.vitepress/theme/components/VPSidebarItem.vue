// Extended version of
https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/components/VPSidebarItem.vue

<script setup lang="ts">
import { useData } from 'vitepress';
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue';
import VPIconChevronRight from 'vitepress/dist/client/theme-default/components/icons/VPIconChevronRight.vue';
// @ts-ignore
import { useSidebarControl } from 'vitepress/dist/client/theme-default/composables/sidebar';
import type { DefaultTheme } from 'vitepress/theme';
import { computed, type HTMLAttributes } from 'vue';

type SidebarItemExtended = { activeMatch?: string; hideItems?: boolean; hidden?: boolean };

const props = defineProps<{
	item: DefaultTheme.SidebarItem & SidebarItemExtended;
	depth: number;
}>();

const { page } = useData();

const activeMatch = computed(() =>
	props.item.activeMatch ? RegExp(props.item.activeMatch).test(`^/${page.value.relativePath}$`) : false,
);

const subItems =
	props.item.items && props.item.hideItems
		? props.item.items.map((item) => ({ ...item, hidden: props.item.hideItems }))
		: props.item.items;

const { collapsed, collapsible, isLink, isActiveLink, hasActiveLink, hasChildren, toggle } = useSidebarControl(
	computed(() => props.item),
);

const sectionTag = computed(() => (hasChildren.value ? 'section' : `div`));

const linkTag = computed(() => (isLink.value ? 'a' : 'div'));

const textTag = computed(() => {
	// eslint-disable-next-line no-nested-ternary
	return !hasChildren.value ? 'p' : props.depth + 2 === 7 ? 'p' : `h${props.depth + 2}`;
});

const itemRole = computed(() => (isLink.value ? undefined : 'button'));

const itemAttrs = computed<HTMLAttributes>(() => ({
	...(itemRole.value && { role: itemRole.value }),
	...(props.item.items && { tabindex: 0 }),
}));

const classes = computed(() => [
	{ hidden: props.item.hidden },
	[`level-${props.depth}`],
	{ collapsible: collapsible.value },
	{ collapsed: collapsed.value },
	{ 'is-link': isLink.value },
	{ 'is-active': isActiveLink.value || activeMatch.value },
	{ 'has-active': hasActiveLink.value },
]);

function onItemInteraction(e: MouseEvent | Event) {
	if ('key' in e && e.key !== 'Enter') {
		return;
	}

	if (!props.item.link) toggle();
}

function onCaretClick() {
	if (props.item.link) toggle();
}
</script>

<template>
	<component :is="sectionTag" class="VPSidebarItem" :class="classes">
		<div
			v-if="item.text"
			class="item"
			v-bind="itemAttrs"
			v-on="item.items ? { click: onItemInteraction, keydown: onItemInteraction } : {}"
		>
			<div class="indicator" />

			<VPLink v-if="item.link" :tag="linkTag" class="link" :href="item.link">
				<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component vue/no-v-html -->
				<component :is="textTag" class="text" v-html="item.text" />
			</VPLink>
			<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component vue/no-v-html -->
			<component :is="textTag" v-else class="text" v-html="item.text" />

			<div
				v-if="item.collapsed != null"
				class="caret"
				role="button"
				aria-label="toggle section"
				tabindex="0"
				@click="onCaretClick"
				@keydown.enter="onCaretClick"
			>
				<VPIconChevronRight class="caret-icon" />
			</div>
		</div>

		<div v-if="item.items && item.items.length" class="items">
			<template v-if="depth < 5">
				<VPSidebarItem v-for="(i, index) in subItems" :key="i.text ?? index" :item="i" :depth="depth + 1" />
			</template>
		</div>
	</component>
</template>

<style scoped>
.VPSidebarItem.level-0 {
	padding-bottom: 24px;
}

.VPSidebarItem.collapsed.level-0 {
	padding-bottom: 10px;
}

.item {
	position: relative;
	display: flex;
	width: 100%;
}

.hidden {
	display: none;
}

.VPSidebarItem.collapsible > .item {
	cursor: pointer;
}

.indicator {
	position: absolute;
	top: 6px;
	bottom: 6px;
	left: -17px;
	width: 1px;
	transition: background-color 0.25s;
}

.VPSidebarItem.level-2.is-active > .item > .indicator,
.VPSidebarItem.level-3.is-active > .item > .indicator,
.VPSidebarItem.level-4.is-active > .item > .indicator,
.VPSidebarItem.level-5.is-active > .item > .indicator {
	background-color: var(--vp-c-brand);
}

.link {
	display: flex;
	align-items: center;
	flex-grow: 1;
}

.text {
	flex-grow: 1;
	padding: 4px 0;
	line-height: 24px;
	font-size: 14px;
	transition: color 0.25s;
}

.VPSidebarItem.level-0 .text {
	font-weight: 700;
	color: var(--vp-c-text-1);
}

.VPSidebarItem.level-1 .text,
.VPSidebarItem.level-2 .text,
.VPSidebarItem.level-3 .text,
.VPSidebarItem.level-4 .text,
.VPSidebarItem.level-5 .text {
	font-weight: 500;
	color: var(--vp-c-text-2);
}

.VPSidebarItem.level-0.is-link > .item > .link:hover .text,
.VPSidebarItem.level-1.is-link > .item > .link:hover .text,
.VPSidebarItem.level-2.is-link > .item > .link:hover .text,
.VPSidebarItem.level-3.is-link > .item > .link:hover .text,
.VPSidebarItem.level-4.is-link > .item > .link:hover .text,
.VPSidebarItem.level-5.is-link > .item > .link:hover .text {
	color: var(--vp-c-brand);
}

.VPSidebarItem.level-0.has-active > .item > .text,
.VPSidebarItem.level-1.has-active > .item > .text,
.VPSidebarItem.level-2.has-active > .item > .text,
.VPSidebarItem.level-3.has-active > .item > .text,
.VPSidebarItem.level-4.has-active > .item > .text,
.VPSidebarItem.level-5.has-active > .item > .text,
.VPSidebarItem.level-0.has-active > .item > .link > .text,
.VPSidebarItem.level-1.has-active > .item > .link > .text,
.VPSidebarItem.level-2.has-active > .item > .link > .text,
.VPSidebarItem.level-3.has-active > .item > .link > .text,
.VPSidebarItem.level-4.has-active > .item > .link > .text,
.VPSidebarItem.level-5.has-active > .item > .link > .text {
	color: var(--vp-c-text-1);
}

.VPSidebarItem.level-0.is-active > .item .link > .text,
.VPSidebarItem.level-1.is-active > .item .link > .text,
.VPSidebarItem.level-2.is-active > .item .link > .text,
.VPSidebarItem.level-3.is-active > .item .link > .text,
.VPSidebarItem.level-4.is-active > .item .link > .text,
.VPSidebarItem.level-5.is-active > .item .link > .text {
	color: var(--vp-c-brand);
}

.caret {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-right: -7px;
	width: 32px;
	height: 32px;
	color: var(--vp-c-text-3);
	cursor: pointer;
	transition: color 0.25s;
	flex-shrink: 0;
}

.item:hover .caret {
	color: var(--vp-c-text-2);
}

.item:hover .caret:hover {
	color: var(--vp-c-text-1);
}

.caret-icon {
	width: 18px;
	height: 18px;
	fill: currentColor;
	transform: rotate(90deg);
	transition: transform 0.25s;
}

.VPSidebarItem.collapsed .caret-icon {
	transform: rotate(0);
}

.VPSidebarItem.level-1 .items,
.VPSidebarItem.level-2 .items,
.VPSidebarItem.level-3 .items,
.VPSidebarItem.level-4 .items,
.VPSidebarItem.level-5 .items {
	border-left: 1px solid var(--vp-c-divider);
	padding-left: 16px;
}

.VPSidebarItem.collapsed .items {
	display: none;
}
</style>
