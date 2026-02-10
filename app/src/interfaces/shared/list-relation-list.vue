<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VNotice from '@/components/v-notice.vue';
import VRemove from '@/components/v-remove.vue';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import Draggable from 'vuedraggable';
import { RouterLink } from 'vue-router';
import RenderTemplate from '@/views/private/components/render-template.vue';

defineProps<{
	displayItems: DisplayItem[];
	totalItemCount: number;
	templateForList: string;
	displayCollection: string;
	relationInfo: any;
	disabled: boolean;
	nonEditable: boolean;
	allowDrag: boolean;
	enableLink: boolean;
	deleteAllowed: boolean;
	getLinkForItem: (item: DisplayItem) => string | null;
	getItemEdits: (item: DisplayItem) => Record<string, any>;
	isLocalItem: (item: DisplayItem) => boolean;
	deleteItem: (item: DisplayItem) => void;
}>();

const emit = defineEmits<{
	'update:items': [value: DisplayItem[]];
	'click:item': [item: DisplayItem];
}>();
</script>

<template>
	<VNotice v-if="displayItems.length === 0">
		{{ $t('no_items') }}
	</VNotice>

	<Draggable
		v-else
		:model-value="displayItems"
		tag="v-list"
		item-key="id"
		handle=".drag-handle"
		:disabled="disabled || !allowDrag"
		v-bind="{ 'force-fallback': true }"
		@update:model-value="emit('update:items', $event)"
	>
		<template #item="{ element }">
			<VListItem
				block
				clickable
				:disabled="disabled && !nonEditable"
				:dense="totalItemCount > 4"
				:class="{ deleted: element.$type === 'deleted' }"
				@click="emit('click:item', element)"
			>
				<VIcon
					v-if="allowDrag && !nonEditable"
					name="drag_handle"
					class="drag-handle"
					left
					:disabled="disabled"
					@click.stop="() => {}"
				/>

				<RenderTemplate
					:collection="displayCollection"
					:item="element"
					:template="templateForList"
				/>

				<div class="spacer" />

				<div v-if="!nonEditable" class="item-actions">
					<RouterLink v-if="enableLink" v-slot="{ href, navigate }" :to="getLinkForItem(element)!" custom>
						<VIcon v-if="disabled || element.$type === 'created'" name="launch" />

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
						v-if="deleteAllowed || isLocalItem(element)"
						:disabled="disabled"
						:item-type="element.$type"
						:item-info="relationInfo"
						:item-is-local="isLocalItem(element)"
						:item-edits="getItemEdits(element)"
						@action="deleteItem(element)"
					/>
				</div>
			</VListItem>
		</template>
	</Draggable>
</template>
