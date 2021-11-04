<template>
	<div class="presentation-links">
		<v-button
			class="action"
			:class="[type]"
			:secondary="type !== 'primary'"
			:disabled="disabled"
			:icon="!label"
			:href="linkRoutes.href"
			:to="linkRoutes.to"
		>
			<v-icon v-if="icon" left :name="icon" />
			<span v-if="label">{{ label }}</span>
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, inject } from 'vue';
import { render } from 'micromustache';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		icon: {
			type: String,
			default: undefined,
		},
		label: {
			type: String,
			default: undefined,
		},
		type: {
			type: String,
			default: undefined,
		},
		url: {
			type: String,
			default: undefined,
		},
	},
	setup(props) {
		const values = inject('values', ref<Record<string, any>>({}));

		const linkRoutes = computed(() => {
			const linkValue = render(props.url ?? '', values.value);

			return {
				href: linkValue.startsWith('/') ? undefined : linkValue,
				to: linkValue.startsWith('/') ? linkValue : undefined,
			};
		});

		return {
			linkRoutes,
		};
	},
});
</script>

<style lang="scss" scoped>
.presentation-links {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.action {
	&.info {
		--v-button-background-color: var(--blue);
		--v-button-background-color-hover: var(--blue-125);
		--v-button-color: var(--blue-alt);
		--v-button-color-hover: var(--blue-alt);
	}

	&.success {
		--v-button-background-color: var(--success);
		--v-button-background-color-hover: var(--success-125);
		--v-button-color: var(--success-alt);
		--v-button-color-hover: var(--success-alt);
	}

	&.warning {
		--v-button-background-color: var(--warning);
		--v-button-background-color-hover: var(--warning-125);
		--v-button-color: var(--warning-alt);
		--v-button-color-hover: var(--warning-alt);
	}

	&.danger {
		--v-button-icon-color: var(--white);
		--v-button-background-color: var(--danger);
		--v-button-background-color-hover: var(--danger-125);
		--v-button-color: var(--danger-alt);
		--v-button-color-hover: var(--danger-alt);
	}
}
</style>
