<template>
	<v-item-group class="v-box-list" :value="[active]" @input="$emit('active', $event[0])">
		<draggable :value="value" handle=".drag-handle" @input="$emit('input', $event)" :set-data="hideDragImage">
			<repeater-list-row
				v-for="(item, index) in value"
				:key="item.id"
				@delete="$emit('delete', index)"
				:value="item"
				:template="template"
				:placeholder="placeholder"
			/>
		</draggable>
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs, computed } from '@vue/composition-api';
import i18n from '@/lang';
import Draggable from 'vuedraggable';
import hideDragImage from '@/utils/hide-drag-image';
import RepeaterListRow from './repeater-list-row.vue';

export default defineComponent({
	components: { Draggable, RepeaterListRow },
	props: {
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
		active: {
			type: Number,
			default: null,
		},
		limit: {
			type: Number,
			default: null,
		},
		template: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: i18n.t('empty_item'),
		},
	},
	setup() {
		return { hideDragImage };
	},
});
</script>

<style lang="scss" scoped>
.v-box-list {
	.row {
		background-color: var(--background-subdued);
		border: 2px solid var(--border-subdued);
		border-radius: var(--border-radius);

		& + .row {
			margin-top: 8px;
		}

		.repeater {
			.row {
				background-color: var(--background-page);
				border-color: var(--border-normal);
			}
		}
	}

	.header {
		display: flex;
		align-items: center;
		padding: 12px;
		cursor: pointer;
	}

	.spacer {
		flex-grow: 1;
	}

	.subdued {
		color: var(--foreground-subdued);
	}

	.v-icon {
		--v-icon-color: var(--foreground-subdued);
	}

	.drag-handle {
		margin-right: 8px;

		&:hover {
			--v-icon-color: var(--foreground-normal);
		}
	}

	.delete:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
