<template>
	<div v-if="actions.length > 0">
		<v-button
			v-for="(action, index) in actions"
			:key="index"
			:class="{ [action.action_style]: true, action: true, link: actions_style === 'link' }"
			:secondary="action.action_style !== 'primary'"
			:disabled="disabled"
			@click="() => dispatch(action, index)"
			:icon="!action.label"
			:is="actions_style === 'link' ? 'a' : 'v-button'"
		>
			<v-icon v-if="action.icon" :name="action.icon" />
			<span v-if="action.label">{{ action.label }}</span>
		</v-button>
		<v-dialog v-if="showError" @esc="showError = false" active>
			<v-card>
				<v-card-title>{{ $t('something_went_wrong') }}</v-card-title>
				<v-card-text>
					{{ $t('interfaces.actions.error') }}
				</v-card-text>
				<v-card-actions>
					<v-button @click="showError = false">{{ $t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, inject } from '@vue/composition-api';
import { render } from 'micromustache';

type Action = {
	icon: string;
	label: string;
	action_style: string;
	url: string;
	open_in_new_window: boolean;
};

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		actions_style: {
			type: String,
			default: 'button',
		},
		actions: {
			type: Array as PropType<Action[]>,
			default: null,
		},
	},
	setup(props, { attrs }) {
		const showError = ref<boolean>(false);
		const values = inject('values', ref<Record<string, any>>({}));

		return {
			dispatch,
			showError,
		};

		function dispatch(action: Action, index: number) {
			if (props.disabled || !values.value) return;

			try {
				const destination = render(action.url, values.value);
				if (action.open_in_new_window) {
					window.open(destination, `${attrs.collection}_${attrs.field}_${index}`);
				} else {
					window.location.href = destination;
				}
			} catch (err) {
				showError.value = true;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-button {
	vertical-align: bottom;
}

.v-icon:not(:last-child) {
	margin-inline-end: 7px;
}

.link {
	margin-inline-start: 10px;
	margin-inline-end: 10px;
	text-decoration: underline;

	&:not([disabled]) {
		--v-button-color: var(--foreground-subdued);
		--v-button-color-hover: var(--foreground-normal);

		color: var(--v-button-color);
		cursor: pointer;

		&:hover {
			color: var(--v-button-color-hover);
		}
	}

	&[disabled] {
		color: var(--foreground-subdued);
		cursor: not-allowed;
	}
}

.action {
	&:not(:first-child) {
		margin-inline-start: 1em;
	}

	&.info {
		--v-button-icon-color: var(--primary);
		--v-button-background-color: var(--primary-alt);
		--v-button-background-color-hover: var(--primary-25);
		--v-button-color: var(--primary);
		--v-button-color-hover: var(--primary-150);
	}

	&.success {
		--v-button-icon-color: var(--success);
		--v-button-background-color: var(--success-alt);
		--v-button-background-color-hover: var(--success-25);
		--v-button-color: var(--success);
		--v-button-color-hover: var(--success-150);
	}

	&.warning {
		--v-button-icon-color: var(--warning);
		--v-button-background-color: var(--warning-alt);
		--v-button-background-color-hover: var(--warning-25);
		--v-button-color: var(--warning);
		--v-button-color-hover: var(--warning-150);
	}

	&.danger {
		--v-button-icon-color: var(--danger);
		--v-button-background-color: var(--danger-alt);
		--v-button-background-color-hover: var(--danger-25);
		--v-button-color: var(--danger);
		--v-button-color-hover: var(--danger-150);
	}
}
</style>
