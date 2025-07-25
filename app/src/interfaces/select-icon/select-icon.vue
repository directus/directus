<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import icons from './icons.json';
import { socialIcons } from '@/components/v-icon/social-icons';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

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

const iconsPerRow = ref(10);

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
			<DynamicScroller
				:items="virtualRows"
				:min-item-size="32"
				:buffer="400"
				:prerender="10"
				:size-field="'32'"
				key-field="rowIndex"
				page-mode
			>
				<template #default="{ item }">
					<DynamicScrollerItem :item="item" active>
						<div v-if="item.type === 'header'" class="group-header">
							<div class="group-name">
								{{ item.groupName }}
							</div>
						</div>
						<div v-else-if="item.type === 'icons'" class="icon-row">
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
		--v-divider-color: var(--theme--background-normal);
		margin: 0 22px;
	}
}

.group-header {
	column-span: all;
	color: var(--theme--form--field--input--foreground-subdued);
	text-transform: uppercase;
	letter-spacing: 0.5px;
	padding: 12px 0;
	text-align: center;
}

.icon-row {
	display: grid;
	grid-gap: 8px;
	grid-template-columns: repeat(auto-fit, 24px);
	justify-content: center;
	padding: 4px 0;
	color: var(--theme--form--field--input--foreground-subdued);
}

.open-indicator {
	transform: scaleY(1);
	transition: transform var(--fast) var(--transition);
}

.open-indicator.open {
	transform: scaleY(-1);
}
</style>
