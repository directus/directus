<script setup lang="ts">
import { ShowSelect } from '@directus/types';
import { RouterLink } from 'vue-router';
import VIcon from '@/components/v-icon/v-icon.vue';
import VRemove from '@/components/v-remove.vue';
import type { Sort } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import type { ListRelationHeader } from '@/composables/use-list-relation';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import RenderTemplate from '@/views/private/components/render-template.vue';

defineProps<{
	sort: Sort | null | undefined;
	headers: ListRelationHeader[];
	selection: DisplayItem[];
	totalItemCount: number;
	loading: boolean;
	displayItems: DisplayItem[];
	itemKey: string;
	tableRowHeight: number;
	showManualSort: boolean;
	sortField: string | undefined;
	showSelect: ShowSelect | undefined;
	disabled: boolean;
	nonEditable: boolean;
	displayCollection: string;
	relationInfo: any;
	enableLink: boolean;
	deleteAllowed: boolean;
	getLinkForItem: (item: DisplayItem) => string | null;
	getItemEdits: (item: DisplayItem) => Record<string, any>;
	isLocalItem: (item: DisplayItem) => boolean;
	deleteItem: (item: DisplayItem) => void;
}>();

const emit = defineEmits<{
	'update:sort': [value: Sort | null | undefined];
	'update:headers': [value: ListRelationHeader[]];
	'update:selection': [value: DisplayItem[]];
	'click:row': [payload: { item: DisplayItem }];
	'update:items': [value: DisplayItem[]];
}>();
</script>

<template>
	<VTable
		:sort="sort"
		:headers="headers"
		:model-value="selection"
		:class="{ 'no-last-border': totalItemCount <= 10 }"
		:disabled="disabled && !nonEditable"
		:loading="loading"
		:items="displayItems"
		:item-key="itemKey"
		:row-height="tableRowHeight"
		:show-manual-sort="showManualSort"
		:manual-sort-key="sortField"
		:show-select="showSelect"
		show-resize
		@update:sort="emit('update:sort', $event)"
		@update:headers="emit('update:headers', $event)"
		@update:model-value="emit('update:selection', $event)"
		@click:row="(e: any) => emit('click:row', e)"
		@update:items="(e: DisplayItem[]) => emit('update:items', e)"
	>
		<template v-for="header in headers" :key="header.value" #[`item.${header.value}`]="{ item }">
			<RenderTemplate
				:title="header.value"
				:collection="displayCollection"
				:item="item"
				:template="`{{${header.value}}}`"
			/>
		</template>

		<template v-if="!nonEditable" #item-append="{ item }">
			<div class="item-actions">
				<RouterLink v-if="enableLink" v-slot="{ href, navigate }" :to="getLinkForItem(item)!" custom>
					<VIcon v-if="disabled || item.$type === 'created'" name="launch" />

					<a
						v-else
						v-tooltip="$t('navigate_to_item')"
						:href="href"
						class="item-link"
						@click.stop="navigate"
						@keydown.stop
					>
						<VIcon name="launch" />
					</a>
				</RouterLink>

				<VRemove
					v-if="deleteAllowed || isLocalItem(item)"
					:disabled="disabled"
					:class="{ deleted: item.$type === 'deleted' }"
					:item-type="item.$type"
					:item-info="relationInfo"
					:item-is-local="isLocalItem(item)"
					:item-edits="getItemEdits(item)"
					@action="deleteItem(item)"
					@keydown.stop
				/>
			</div>
		</template>
	</VTable>
</template>
