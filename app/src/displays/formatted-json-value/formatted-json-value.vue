<template>
	<div>
		<value-null v-if="!displayValue" />

		<v-menu v-else-if="displayValue.length > 1" show-arrow>
			<template #activator="{ toggle }">
				<span @click.stop="toggle" class="toggle">
					<span class="label">
						{{ displayValue.length }}
						<template v-if="displayValue.length >= 100">+</template>
						{{ $t('items') }}
					</span>
				</span>
			</template>

			<v-list class="links">
				<v-list-item v-for="(item, index) in displayValue" :key="index">
					<v-list-item-content>
						<render-template :template="format" :item="item" />
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<span v-else>
			<render-template class="label" :template="format" :item="displayValue[0]" />
		</span>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: [Object, Array],
			default: null,
		},
		format: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const displayValue = computed(() => {
			if (!props.value) return null;

			if (Array.isArray(props.value)) {
				return props.value;
			} else {
				return [props.value];
			}
		});

		return { displayValue };
	},
});
</script>
<style lang="scss" scoped>
.label {
	position: relative;
	z-index: 2;
	height: var(--v-list-item-min-height);
}
.toggle {
	position: relative;

	&::before {
		position: absolute;
		top: -6px;
		left: -6px;
		z-index: 1;
		width: calc(100% + 12px);
		height: calc(100% + 12px);
		background-color: var(--background-normal);
		border-radius: var(--border-radius);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		content: '';
	}

	:hover::before {
		opacity: 1;
	}

	:active::before {
		background-color: var(--background-normal-alt);
	}
}

.links {
	.v-list-item-content {
		height: var(--v-list-item-min-height);
	}
}
</style>
