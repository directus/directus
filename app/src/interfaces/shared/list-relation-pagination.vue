<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VPagination from '@/components/v-pagination.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { LAYOUTS } from '@/types/interfaces';

defineProps<{
	layout: string;
	pageCount: number;
	page: number;
	limit: number;
	width: string;
	loading: boolean;
	disabled: boolean;
	nonEditable: boolean;
	showCreateInList: boolean;
	showSelectInList: boolean;
}>();

const emit = defineEmits<{
	'update:page': [value: number];
	'update:limit': [value: number];
	create: [];
	openSelect: [];
}>();
</script>

<template>
	<template v-if="layout === LAYOUTS.TABLE">
		<div v-if="pageCount > 1" class="actions">
			<VPagination
				:model-value="page"
				:disabled="disabled && !nonEditable"
				:length="pageCount"
				:total-visible="width.includes('half') ? 1 : 2"
				show-first-last
				@update:model-value="emit('update:page', $event)"
			/>

			<div class="spacer" />

			<div v-if="loading === false" class="per-page">
				<span>{{ $t('per_page') }}</span>
				<VSelect
					:model-value="limit"
					:disabled="disabled && !nonEditable"
					:items="['10', '20', '30', '50', '100']"
					inline
					@update:model-value="emit('update:limit', Number($event))"
				/>
			</div>
		</div>
	</template>
	<template v-else>
		<div v-if="!nonEditable || pageCount > 1" class="actions">
			<template v-if="!nonEditable">
				<VButton v-if="showCreateInList" :disabled="disabled" @click="emit('create')">
					{{ $t('create_new') }}
				</VButton>

				<VButton v-if="showSelectInList" :disabled="disabled" @click="emit('openSelect')">
					{{ $t('add_existing') }}
				</VButton>
			</template>

			<div class="spacer" />

			<VPagination
				v-if="pageCount > 1"
				:model-value="page"
				:disabled="disabled && !nonEditable"
				:length="pageCount"
				:total-visible="2"
				show-first-last
				@update:model-value="emit('update:page', $event)"
			/>
		</div>
	</template>
</template>
