<template>
	<v-menu show-arrow placement="bottom-end">
		<template #activator="{ toggle }">
			<v-icon clickable @click.stop="toggle" name="more_vert" />
		</template>

		<v-list>
			<v-list-item :to="`/settings/data-model/${field.collection}/${field.field}`">
				<v-list-item-icon><v-icon name="edit" outline /></v-list-item-icon>
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
				@click="$emit('setWidth', 'half')"
				:disabled="field.meta?.width === 'half' || localType === 'group'"
			>
				<v-list-item-icon><v-icon name="border_vertical" /></v-list-item-icon>
				<v-list-item-content>{{ t('half_width') }}</v-list-item-content>
			</v-list-item>

			<v-list-item
				clickable
				@click="$emit('setWidth', 'full')"
				:disabled="field.meta?.width === 'full' || localType === 'group'"
			>
				<v-list-item-icon><v-icon name="border_right" /></v-list-item-icon>
				<v-list-item-content>{{ t('full_width') }}</v-list-item-content>
			</v-list-item>

			<v-list-item
				clickable
				@click="$emit('setWidth', 'fill')"
				:disabled="field.meta?.width === 'fill' || localType === 'group'"
			>
				<v-list-item-icon><v-icon name="aspect_ratio" /></v-list-item-icon>
				<v-list-item-content>{{ t('fill_width') }}</v-list-item-content>
			</v-list-item>

			<v-divider />

			<v-list-item
				clickable
				@click="$emit('delete')"
				class="danger"
				:disabled="field.schema?.is_primary_key === true || noDelete"
			>
				<v-list-item-icon><v-icon name="delete" outline /></v-list-item-icon>
				<v-list-item-content>
					{{ t('delete_field') }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { Field } from '@/types';
import { useI18n } from 'vue-i18n';
import { getLocalTypeForField } from '../../get-local-type';

export default defineComponent({
	name: 'field-select-menu',
	emits: ['toggleVisibility', 'duplicate', 'delete', 'setWidth'],
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		noDelete: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const localType = computed(() => getLocalTypeForField(props.field.collection, props.field.field));
		const isPrimaryKey = computed(() => props.field.schema?.is_primary_key === true);

		const duplicable = computed(() => localType.value === 'standard' && isPrimaryKey.value === false);

		return { t, localType, isPrimaryKey, duplicable };
	},
});
</script>
