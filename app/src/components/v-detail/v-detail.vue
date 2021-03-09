<template>
	<div class="v-detail" :class="{ disabled }">
		<v-divider @click.native="_active = !_active">
			<v-icon v-if="!disabled" :name="_active ? 'unfold_less' : 'unfold_more'" small />
			<slot name="title">{{ label }}</slot>
		</v-divider>
		<transition-expand>
			<div v-if="_active">
				<slot />
			</div>
		</transition-expand>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import { i18n } from '@/lang';

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},

	props: {
		active: {
			type: Boolean,
			default: undefined,
		},
		label: {
			type: String,
			default: i18n.t('toggle'),
		},
		startOpen: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},

	setup(props, { emit }) {
		const localActive = ref(props.startOpen);
		const _active = computed({
			get() {
				if (props.active !== undefined) {
					return props.active;
				}
				return localActive.value;
			},
			set(newActive: boolean) {
				localActive.value = newActive;
				emit('toggle', newActive);
			},
		});

		return { _active };
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin-bottom: 12px;
	cursor: pointer;
}

.v-detail:not(.disabled) .v-divider {
	--v-divider-label-color: var(--foreground-subdued);
	&:hover {
		--v-divider-label-color: var(--foreground-normal-alt);
		cursor: pointer;
	}
}

.v-icon {
	margin-right: 4px;
}
</style>
