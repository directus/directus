<template>
	<div class="v-detail" :class="{ _active }">
		<v-divider @click.native="_active = !_active">
			<slot name="title">{{ $t('toggle') }}</slot>
			<v-icon name="unfold_more" small />
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
	},

	setup(props, { emit }) {
		const localActive = ref(false);
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

	&:hover {
		--v-divider-label-color: var(--foreground-normal);
	}
}

.v-icon {
	margin-left: 4px;
}
</style>
