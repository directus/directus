<template>
	<div v-if="actions.length > 0">
		<v-button
			v-for="(action, index) in actions"
			:key="index"
			:class="{ [action.actionStyle]: true, action: true, link: actionsStyle === 'link' }"
			:secondary="action.actionStyle !== 'primary'"
			:disabled="disabled"
			@click="() => dispatch(action.url, index)"
			:is="actionsStyle === 'link' ? 'a' : 'v-button'"
		>
			<v-icon v-if="action.icon" :name="action.icon" />
			<span v-if="action.label">{{ action.label }}</span>
		</v-button>
		<v-dialog v-if="showError" active>
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
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { render } from 'micromustache';
import VButtonGroup from '@/components/v-button-group/v-button-group.vue';

type Action = {
	icon: string;
	label: string;
	actionStyle: string;
	url: string;
};

export default defineComponent({
	components: { VButtonGroup },
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		actionsStyle: {
			type: String,
			default: 'button',
		},
		actions: {
			type: Array as PropType<Action[]>,
			default: null,
		},
	},
	setup(props, { parent, attrs }) {
		const showError = ref<boolean>(false);
		return {
			dispatch,
			showError,
		};

		function dispatch(url: string, index: number) {
			if (props.disabled || !parent || !parent.$parent.$parent?.values) return;

			try {
				window.open(render(url, parent.$parent.$parent.values), `${attrs.collection}_${attrs.field}_${index}`);
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
	&:not(:last-child) {
		margin-inline-end: 1em;
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
