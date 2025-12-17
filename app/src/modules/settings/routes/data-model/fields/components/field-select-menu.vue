<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { getLocalTypeForField } from '@/utils/get-local-type';
import type { Field, Width } from '@directus/types';
import { computed } from 'vue';

const props = defineProps<{
	field: Field;
	noDelete?: boolean;
}>();

defineEmits<{
	toggleVisibility: [];
	duplicate: [];
	delete: [];
	setWidth: [Width];
}>();

const localType = computed(() => getLocalTypeForField(props.field.collection, props.field.field));
const isPrimaryKey = computed(() => props.field.schema?.is_primary_key === true);

const duplicable = computed(() => localType.value === 'standard' && isPrimaryKey.value === false);
</script>

<template>
	<VMenu show-arrow placement="bottom-end" full-height>
		<template #activator="{ toggle }">
			<VIcon clickable name="more_vert" @click="toggle" />
		</template>

		<VList>
			<VListItem :to="`/settings/data-model/${field.collection}/${field.field}`">
				<VListItemIcon><VIcon name="edit" /></VListItemIcon>
				<VListItemContent>
					{{ $t('edit_field') }}
				</VListItemContent>
			</VListItem>

			<VListItem :disabled="duplicable === false" clickable @click="$emit('duplicate')">
				<VListItemIcon>
					<VIcon name="content_copy" />
				</VListItemIcon>
				<VListItemContent>{{ $t('duplicate_field') }}</VListItemContent>
			</VListItem>

			<VListItem clickable @click="$emit('toggleVisibility')">
				<template v-if="field.meta?.hidden === false">
					<VListItemIcon><VIcon name="visibility_off" /></VListItemIcon>
					<VListItemContent>{{ $t('hide_field_on_detail') }}</VListItemContent>
				</template>
				<template v-else>
					<VListItemIcon><VIcon name="visibility" /></VListItemIcon>
					<VListItemContent>{{ $t('show_field_on_detail') }}</VListItemContent>
				</template>
			</VListItem>

			<VDivider />

			<VListItem
				clickable
				:disabled="field.meta?.width === 'half' || localType === 'group'"
				@click="$emit('setWidth', 'half')"
			>
				<VListItemIcon><VIcon name="border_vertical" /></VListItemIcon>
				<VListItemContent>{{ $t('half_width') }}</VListItemContent>
			</VListItem>

			<VListItem
				clickable
				:disabled="field.meta?.width === 'full' || localType === 'group'"
				@click="$emit('setWidth', 'full')"
			>
				<VListItemIcon><VIcon name="border_right" /></VListItemIcon>
				<VListItemContent>{{ $t('full_width') }}</VListItemContent>
			</VListItem>

			<VListItem
				clickable
				:disabled="field.meta?.width === 'fill' || localType === 'group'"
				@click="$emit('setWidth', 'fill')"
			>
				<VListItemIcon><VIcon name="aspect_ratio" /></VListItemIcon>
				<VListItemContent>{{ $t('fill_width') }}</VListItemContent>
			</VListItem>

			<VDivider />

			<VListItem
				clickable
				class="danger"
				:disabled="field.schema?.is_primary_key === true || noDelete"
				@click="$emit('delete')"
			>
				<VListItemIcon><VIcon name="delete" /></VListItemIcon>
				<VListItemContent>
					{{ $t('delete_field') }}
				</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style scoped>
.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}
</style>
