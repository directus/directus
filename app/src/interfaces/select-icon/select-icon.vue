<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, ref, nextTick, watch, type Ref, onUnmounted } from 'vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import icons from './icons.json';
import { socialIcons } from '@/components/v-icon/social-icons';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		nonEditable?: boolean;
		width?: string;
	}>(),
	{
		width: 'half',
	},
);

const emit = defineEmits(['input']);

const searchQuery = ref('');
const menuActive = ref(false);
const contentRef = ref<HTMLElement>();

// for virtual scroller
const MIN_ITEM_SIZE = 32;

const { iconsPerRow, iconSize, gap } = useIconsPerRow(contentRef, menuActive);

const mergedIcons = [
	...icons,
	{
		name: 'Social',
		icons: socialIcons,
	},
];

const filteredIcons = computed(() => {
	if (searchQuery.value.length === 0) return mergedIcons;

	return mergedIcons.map((group) => {
		const icons = group.icons.filter((icon) => icon.includes(searchQuery.value.toLowerCase()));

		return {
			name: group.name,
			icons,
		};
	});
});

// Create flattened rows for virtualization
const virtualRows = computed(() => {
	const rows: Array<{
		type: 'header' | 'icons';
		groupName?: string;
		icons?: string[];
		rowIndex: number;
		groupIndex: number;
	}> = [];

	filteredIcons.value.forEach((group, groupIndex) => {
		if (group.icons.length > 0) {
			// Add group header
			rows.push({
				type: 'header',
				groupName: group.name,
				rowIndex: rows.length,
				groupIndex,
			});

			// Split icons into rows
			for (let i = 0; i < group.icons.length; i += iconsPerRow.value) {
				const rowIcons = group.icons.slice(i, i + iconsPerRow.value);

				rows.push({
					type: 'icons',
					icons: rowIcons,
					rowIndex: rows.length,
					groupIndex,
				});
			}
		}
	});

	return rows;
});

function setIcon(icon: string | null) {
	searchQuery.value = '';
	emit('input', icon);
}

function onClickInput(e: InputEvent, toggle: () => void) {
	if ((e.target as HTMLInputElement).tagName === 'INPUT') toggle();
}

function onKeydownInput(e: KeyboardEvent, activate: () => void) {
	const systemKeys = e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.key === 'Tab';

	if (!e.repeat && !systemKeys && (e.target as HTMLInputElement).tagName === 'INPUT') activate();
}

interface IconsPerRowConfig {
	iconSize?: number;
	gap?: number;
	contentPadding?: number;
	rowPadding?: number;
	defaultIconsPerRow?: number;
}

function useIconsPerRow(
	contentRef: Ref<HTMLElement | undefined>,
	menuActive: Ref<boolean>,
	config: IconsPerRowConfig = {},
) {
	const { iconSize = 24, gap = 8, contentPadding = 16, rowPadding = 8, defaultIconsPerRow = 1 } = config;

	const iconsPerRow = ref(defaultIconsPerRow);
	let resizeObserver: ResizeObserver | null = null;

	function calculateIconsPerRow() {
		if (!contentRef.value) return;

		const contentWidth = contentRef.value.clientWidth;

		const availableWidth = contentWidth - contentPadding - rowPadding;
		const iconsPerRowCalculated = Math.floor(availableWidth / (iconSize + gap));

		iconsPerRow.value = Math.max(defaultIconsPerRow, iconsPerRowCalculated);
	}

	function setupResizeObserver() {
		if (!contentRef.value) return;

		if (resizeObserver) {
			resizeObserver.disconnect();
		}

		resizeObserver = new ResizeObserver(() => {
			calculateIconsPerRow();
		});

		resizeObserver.observe(contentRef.value);
	}

	function cleanupResizeObserver() {
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
	}

	// Calculate icons per row when menu opens
	watch(menuActive, async (isActive) => {
		if (isActive) {
			await nextTick();
			setupResizeObserver();
			calculateIconsPerRow();
		} else {
			cleanupResizeObserver();
		}
	});

	// Cleanup on unmount
	onUnmounted(() => {
		cleanupResizeObserver();
	});

	return {
		iconsPerRow,
		iconSize,
		gap,
		contentPadding,
		rowPadding,
		defaultIconsPerRow,
	};
}
</script>

<template>
	<v-menu v-model="menuActive" attached :disabled="disabled" no-focus-return>
		<template #activator="{ active, activate, deactivate, toggle }">
			<v-input
				v-model="searchQuery"
				:disabled="disabled"
				:placeholder="value ? formatTitle(value) : $t('interfaces.select-icon.search_for_icon')"
				:class="{ 'has-value': value }"
				:nullable="false"
				@click="onClickInput($event, toggle)"
				@keydown="onKeydownInput($event, activate)"
			>
				<template v-if="value" #prepend>
					<v-icon clickable :name="value" :class="{ active: value }" @click="toggle" />
				</template>

				<template #append>
					<div class="item-actions">
						<v-remove
							v-if="value !== null && !nonEditable"
							deselect
							@action="
								() => {
									setIcon(null);
									deactivate();
								}
							"
						/>

						<v-icon
							v-else
							clickable
							name="expand_more"
							class="open-indicator"
							:class="{ open: active }"
							@click="toggle"
						/>
					</div>
				</template>
			</v-input>
		</template>

		<div ref="contentRef" class="content" :class="width">
			<DynamicScroller
				:min-item-size="MIN_ITEM_SIZE"
				:items="virtualRows"
				:buffer="400"
				:prerender="10"
				key-field="rowIndex"
				page-mode
			>
				<template #default="{ item }">
					<DynamicScrollerItem :item="item" active>
						<v-divider v-if="item.type === 'header'" inline-title class="icon-row">
							{{ item.groupName }}
						</v-divider>

						<div
							v-else-if="item.type === 'icons'"
							class="icon-row"
							:style="{
								'--icons-per-row': iconsPerRow,
								'--icon-size': `${iconSize}px`,
								'--gap': `${gap}px`,
							}"
						>
							<v-icon
								v-for="icon in item.icons"
								:key="icon"
								:name="icon"
								:class="{ active: icon === value }"
								clickable
								@click="setIcon(icon)"
							/>
						</div>
					</DynamicScrollerItem>
				</template>
			</DynamicScroller>
		</div>
	</v-menu>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.item-actions {
	@include mixins.list-interface-item-actions;
}

.v-input.has-value {
	--v-input-placeholder-color: var(--theme--primary);

	&:focus-within {
		--v-input-placeholder-color: var(--theme--form--field--input--foreground-subdued);
	}
}

.content {
	padding: 8px;

	--v-icon-color-hover: var(--theme--form--field--input--foreground);

	.v-icon.active {
		color: var(--theme--primary);
	}

	.v-divider {
		--v-divider-label-color: var(--theme--foreground-subdued);
	}
}

.icon-row {
	display: grid;
	gap: var(--gap, 8px);
	grid-template-columns: repeat(var(--icons-per-row, 1), var(--icon-size, 24px));
	justify-content: start;
	color: var(--theme--form--field--input--foreground-subdued);
	padding: 4px;
}

.open-indicator {
	transform: scaleY(1);
	transition: transform var(--fast) var(--transition);
}

.open-indicator.open {
	transform: scaleY(-1);
}
</style>
