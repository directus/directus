<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import icons from './icons.json';
import { socialIcons } from '@/components/v-icon/social-icons';
import { useVirtualList } from '@vueuse/core';

withDefaults(
	defineProps<{
		value: string | null;
		disabled?: boolean;
		width?: string;
	}>(),
	{
		width: 'half',
	},
);

const emit = defineEmits(['input']);

const { t } = useI18n();

const searchQuery = ref('');

const mergedIcons = [
	...icons,
	{
		name: 'Social',
		icons: socialIcons,
	},
];

const ICONS_PER_ROW = 7;
const ROW_HEIGHT = 32;

const virtualIconRows = computed(() => {
	// Build a flat list of icon objects with group info
	const flatList: Array<{ icon: string; group: string; isFirstInGroup: boolean }> = [];

	for (const group of mergedIcons) {
		let icons = group.icons;

		if (searchQuery.value.length > 0) {
			icons = icons.filter((icon) => icon.includes(searchQuery.value.toLowerCase()));
		}

		icons.forEach((icon, idx) => {
			flatList.push({
				icon,
				group: group.name,
				isFirstInGroup: idx === 0,
			});
		});
	}

	// Chunk into rows of icons
	const rows: Array<{ icons: typeof flatList; groupName?: string }> = [];
	let i = 0;

	while (i < flatList.length) {
		const row: typeof flatList = [];

		for (let j = 0; j < ICONS_PER_ROW && i < flatList.length; j++, i++) {
			if (j > 0 && flatList[i]?.isFirstInGroup) break;
			row.push(flatList[i]!);
		}

		const groupName = row[0]?.isFirstInGroup ? row[0].group : undefined;
		rows.push({ icons: row, groupName });
	}

	return rows;
});

const {
	list: virtualRows,
	containerProps,
	wrapperProps,
	// Not sure how to type this without using any
} = useVirtualList(virtualIconRows as any, {
	itemHeight: ROW_HEIGHT,
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
</script>

<template>
	<v-menu attached :disabled="disabled" no-focus-return>
		<template #activator="{ active, activate, deactivate, toggle }">
			<v-input
				v-model="searchQuery"
				:disabled="disabled"
				:placeholder="value ? formatTitle(value) : t('interfaces.select-icon.search_for_icon')"
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
							v-if="value !== null"
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

		<div class="content" :class="width">
			<div v-bind="containerProps" style="max-height: 260px; overflow-y: auto">
				<div v-if="virtualIconRows.length === 0" class="no-results" tabindex="0">
					{{ t('no_results_found') }}
				</div>
				<div v-else v-bind="wrapperProps">
					<template v-for="({ data: row }, i) in virtualRows" :key="'row-' + i">
						<!-- Divider with group name if this is the first row of a group -->
						<div v-if="row.groupName" class="group-divider">
							<span class="group-label">{{ row.groupName }}</span>
						</div>
						<div v-if="row.icons && row.icons.length" class="icons-row">
							<v-icon
								v-for="iconObj in row.icons"
								:key="iconObj.icon"
								:name="iconObj.icon"
								:class="{ active: iconObj.icon === value }"
								clickable
								@click="setIcon(iconObj.icon)"
							/>
						</div>
					</template>
				</div>
			</div>
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
		--v-divider-color: var(--theme--background-normal);

		margin: 0 22px;
	}
}

.open-indicator {
	transform: scaleY(1);
	transition: transform var(--fast) var(--transition);
}

.open-indicator.open {
	transform: scaleY(-1);
}

.icons-row {
	display: grid;
	grid-template-columns: repeat(auto-fit, 24px);
	grid-gap: 6px;
	justify-content: center;
	padding: 8px 0;

	color: var(--theme--form--field--input--foreground-subdued);
}

.group-divider {
	display: flex;
	align-items: center;
	margin: 8px 0 0;
	padding: 0 8px;
	color: var(--theme--form--field--input--foreground);
	text-transform: uppercase;
	font-weight: bold;
	line-height: 32px;
	border-block-start: 1px solid var(--theme--form--field--input--foreground-subdued);
	border-block-end: 1px solid var(--theme--form--field--input--foreground-subdued);
}

.group-label {
	margin-inline: auto;
	color: var(--theme--form--field--input--foreground-subdued);
}
</style>
