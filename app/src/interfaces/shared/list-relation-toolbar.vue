<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import SearchInput from '@/views/private/components/search-input.vue';

defineProps<{
	width: string;
	totalItemCount: number;
	showingCount: string;
	search: string;
	searchFilter: any;
	enableSearchFilter: boolean;
	disabled: boolean;
	nonEditable: boolean;
	displayCollection: string;
	showBatchEdit: boolean;
	showSelectButton: boolean;
	showCreateButton: boolean;
	selectButtonTooltip?: string;
	createButtonTooltip?: string;
	enableCreate: boolean;
}>();

const emit = defineEmits<{
	'update:search': [value: string];
	'update:searchFilter': [value: any];
	batchEdit: [];
	openSelect: [];
	create: [];
}>();
</script>

<template>
	<div class="actions top" :class="width">
		<div class="spacer" />

		<div v-if="totalItemCount" class="item-count">
			{{ showingCount }}
		</div>

		<template v-if="!nonEditable">
			<div v-if="enableSearchFilter && (totalItemCount > 10 || search || searchFilter)" class="search">
				<SearchInput
					:model-value="search"
					:filter="searchFilter"
					:collection="displayCollection"
					:disabled="disabled"
					@update:model-value="emit('update:search', $event || '')"
					@update:filter="emit('update:searchFilter', $event)"
				/>
			</div>

			<VButton
				v-if="showBatchEdit"
				v-tooltip.bottom="$t('edit')"
				rounded
				icon
				secondary
				:disabled="disabled"
				@click="emit('batchEdit')"
			>
				<VIcon name="edit" outline />
			</VButton>

			<VButton
				v-if="showSelectButton"
				v-tooltip.bottom="selectButtonTooltip ?? $t('add_existing')"
				rounded
				icon
				:secondary="enableCreate"
				:disabled="disabled"
				@click="emit('openSelect')"
			>
				<VIcon name="playlist_add" />
			</VButton>

			<VButton
				v-if="showCreateButton"
				v-tooltip.bottom="createButtonTooltip ?? $t('create_item')"
				rounded
				icon
				:disabled="disabled"
				@click="emit('create')"
			>
				<VIcon name="add" />
			</VButton>
		</template>
	</div>
</template>
