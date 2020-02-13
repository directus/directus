<template>
	<span
		v-if="_active"
		class="v-chip"
		:class="[sizeClass, { outlined, label, disabled, close }]"
		@click="onClick"
	>
		<span class="chip-content">
			<slot />
			<span
				v-if="close"
				class="close-outline"
				:class="{ disabled }"
				@click.stop="onCloseClick"
			>
				<v-icon class="close" :name="closeIcon" x-small />
			</span>
		</span>
	</span>
</template>

<script lang="ts">
import { createComponent, ref, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';
import useSizeClass, { sizeProps } from '@/compositions/size-class';

export default createComponent({
	props: {
		active: {
			type: Boolean,
			default: null
		},
		close: {
			type: Boolean,
			default: false
		},
		closeIcon: {
			type: String,
			default: 'close'
		},
		outlined: {
			type: Boolean,
			default: false
		},
		label: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		...sizeProps
	},
	setup(props, { emit }) {
		const _localActive = ref(true);

		const _active = computed<boolean>({
			get: () => {
				if (props.active !== null) return props.active;
				return _localActive.value;
			},
			set: (active: boolean) => {
				emit('update:active', active);
				_localActive.value = active;
			}
		});

		const sizeClass = useSizeClass(props);

		return { sizeClass, _active, onClick, onCloseClick };

		function onClick(event: MouseEvent) {
			if (props.disabled) return;
			emit('click', event);
		}

		function onCloseClick(event: MouseEvent) {
			if (props.disabled) return;
			_active.value = !_active.value;
			emit('close', event);
		}
	}
});
</script>

<style lang="scss" scoped>
.v-chip {
	--v-chip-color: var(--chip-primary-text-color);
	--v-chip-background-color: var(--chip-primary-background-color);
	--v-chip-hover-color: var(--chip-primary-text-color);
	--v-chip-hover-background-color: var(--chip-primary-background-color-hover);

	display: inline-flex;
	height: 32px;
	padding: 0 12px;
	align-items: center;

	color: var(--v-chip-color);
	background-color: var(--v-chip-background-color);
	border-radius: 16px;
	font-weight: var(--weight-normal);

	&:hover {
		color: var(--v-chip-hover-color);
		background-color: var(--v-chip-hover-background-color);
	}

	&.label {
		border-radius: var(--border-radius);
	}

	&.outlined {
		background-color: transparent;
		border: var(--input-border-width) solid var(--v-chip-background-color);
	}

	&.disabled {
		color: var(--chip-primary-text-color-disabled);
		background-color: var(--chip-primary-background-color-disabled);
	}

	&.x-small {
		font-size: 12px;
		height: 20px;
		border-radius: 10px;
	}

	&.small {
		font-size: 14px;
		height: 24px;
		border-radius: 12px;
	}

	&.large {
		font-size: 16px;
		height: 44px;
		border-radius: 22px;
	}

	&.x-large {
		font-size: 18px;
		height: 48px;
		border-radius: 24px;
	}

	.chip-content {
		display: inline-flex;
		align-items: center;

		.close-outline {
			position: relative;
			display: inline-flex;
			justify-content: center;
			align-items: center;

			background-color: var(--chip-primary-close-color);
			border-radius: 10px;
			height: 14px;
			width: 14px;
			right: -4px;
			margin-left: 4px;

			.close {
				--v-icon-color: var(--v-chip-background-color);
			}

			&.disabled {
				background-color: var(--chip-primary-close-color-disabled);

				&:hover {
					background-color: var(--chip-primary-close-color-disabled);
				}
			}

			&:hover {
				background-color: var(--chip-primary-close-color-hover);
			}
		}
	}
}
</style>
