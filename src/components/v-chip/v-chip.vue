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
	--v-chip-color: var(--input-foreground-color);
	--v-chip-background-color: var(--input-border-color);
	--v-chip-color-hover: var(--input-foreground-color-hover);
	--v-chip-background-color-hover: var(--input-border-color-hover);

	display: inline-flex;
	align-items: center;
	height: 32px;
	padding: 0 12px;
	color: var(--v-chip-color);
	font-weight: var(--weight-normal);
	background-color: var(--v-chip-background-color);
	border: var(--input-border-width) solid var(--v-chip-background-color);
	border-radius: 16px;

	&:hover {
		color: var(--v-chip-color-hover);
		background-color: var(--v-chip-background-color-hover);
		border-color: var(--v-chip-background-color-hover);
		cursor: pointer;
	}

	&.label {
		border-radius: var(--border-radius);
	}

	&.outlined {
		background-color: transparent;
	}

	&.disabled {
		color: var(--chip-primary-text-color-disabled);
		background-color: var(--chip-primary-background-color-disabled);
	}

	&.x-small {
		height: 20px;
		font-size: 12px;
		border-radius: 10px;
	}

	&.small {
		height: 24px;
		font-size: 14px;
		border-radius: 12px;
	}

	&.large {
		height: 44px;
		padding: 0 20px;
		font-size: 16px;
		border-radius: 22px;
	}

	&.x-large {
		height: 48px;
		padding: 0 20px;
		font-size: 18px;
		border-radius: 24px;
	}

	.chip-content {
		display: inline-flex;
		align-items: center;

		.close-outline {
			position: relative;
			right: -4px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 14px;
			height: 14px;
			margin-left: 4px;
			background-color: var(--chip-primary-close-color);
			border-radius: 10px;

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
