<script setup lang="ts">
import { getLocalTypeForField } from '@/utils/get-local-type';
import { Field } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	field: Field;
	noDelete?: boolean;
}>();

defineEmits(['toggleVisibility', 'duplicate', 'delete', 'setWidth']);

const { t } = useI18n();

const localType = computed(() => getLocalTypeForField(props.field.collection, props.field.field));
const isPrimaryKey = computed(() => props.field.schema?.is_primary_key === true);

const duplicable = computed(() => localType.value === 'standard' && isPrimaryKey.value === false);
</script>

<template>
	<v-menu show-arrow placement="bottom-end">
		<template #activator="{ toggle }">
			<v-icon clickable name="more_vert" @click="toggle" />
		</template>

		<v-list>
			<v-list-item :to="`/settings/data-model/${field.collection}/${field.field}`">
				<v-list-item-icon><v-icon name="edit" /></v-list-item-icon>
				<v-list-item-content>
					{{ t('edit_field') }}
				</v-list-item-content>
			</v-list-item>

			<v-list-item :disabled="duplicable === false" clickable @click="$emit('duplicate')">
				<v-list-item-icon>
					<v-icon name="content_copy" />
				</v-list-item-icon>
				<v-list-item-content>{{ t('duplicate_field') }}</v-list-item-content>
			</v-list-item>

			<v-list-item clickable @click="$emit('toggleVisibility')">
				<template v-if="field.meta?.hidden === false">
					<v-list-item-icon><v-icon name="visibility_off" /></v-list-item-icon>
					<v-list-item-content>{{ t('hide_field_on_detail') }}</v-list-item-content>
				</template>
				<template v-else>
					<v-list-item-icon><v-icon name="visibility" /></v-list-item-icon>
					<v-list-item-content>{{ t('show_field_on_detail') }}</v-list-item-content>
				</template>
			</v-list-item>

			<v-divider />

			<v-list-item
				clickable
				:disabled="field.meta?.width === 'half' || localType === 'group'"
				@click="$emit('setWidth', 'half')"
			>
				<v-list-item-icon><v-icon name="border_vertical" /></v-list-item-icon>
				<v-list-item-content>{{ t('half_width') }}</v-list-item-content>
			</v-list-item>

			<v-list-item
				clickable
				:disabled="field.meta?.width === 'full' || localType === 'group'"
				@click="$emit('setWidth', 'full')"
			>
				<v-list-item-icon><v-icon name="border_right" /></v-list-item-icon>
				<v-list-item-content>{{ t('full_width') }}</v-list-item-content>
			</v-list-item>

			<v-list-item
				clickable
				:disabled="field.meta?.width === 'fill' || localType === 'group'"
				@click="$emit('setWidth', 'fill')"
			>
				<v-list-item-icon><v-icon name="aspect_ratio" /></v-list-item-icon>
				<v-list-item-content>{{ t('fill_width') }}</v-list-item-content>
			</v-list-item>

			<v-divider />

			<v-list-item
				clickable
				class="danger"
				:disabled="field.schema?.is_primary_key === true || noDelete"
				@click="$emit('delete')"
			>
				<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
				<v-list-item-content>
					{{ t('delete_field') }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<style scoped>
.v-list-item.danger {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}
</style>
