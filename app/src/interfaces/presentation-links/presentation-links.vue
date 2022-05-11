<template>
	<div class="presentation-links">
		<v-button
			v-for="(link, index) in linksParsed"
			:key="index"
			class="action"
			:class="[link.type]"
			:secondary="link.type !== 'primary'"
			:disabled="disabled"
			:icon="!link.label"
			:href="link.href"
			:to="link.to"
		>
			<v-icon v-if="link.icon" left :name="link.icon" />
			<span v-if="link.label">{{ link.label }}</span>
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, inject, computed } from 'vue';
import { render } from 'micromustache';
import { omit } from 'lodash';

type Link = {
	icon: string;
	label: string;
	type: string;
	url?: string;
};

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		links: {
			type: Array as PropType<Link[]>,
			default: null,
		},
	},
	setup(props) {
		const values = inject('values', ref<Record<string, any>>({}));

		const linksParsed = computed(() => {
			return props.links.map((link) => {
				const parsedLink = omit<Record<string, any>>(link, ['url']);
				const linkValue = render(link.url ?? '', values.value);

				if (linkValue.startsWith('/')) {
					parsedLink.to = linkValue;
				} else {
					parsedLink.href = linkValue;
				}

				return parsedLink;
			});
		});

		return {
			linksParsed,
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
	&.success {
		--v-button-background-color: var(--g-color-success-normal);
		--v-button-background-color-hover: var(--g-color-success-accent);
		--v-button-color: var(--g-color-success-subtle);
		--v-button-color-hover: var(--g-color-success-subtle);
	}

	&.warning {
		--v-button-background-color: var(--g-color-warning-normal);
		--v-button-background-color-hover: var(--g-color-warning-accent);
		--v-button-color: var(--g-color-warning-subtle);
		--v-button-color-hover: var(--g-color-warning-subtle);
	}

	&.danger {
		--v-button-icon-color: var(--white);
		--v-button-background-color: var(--g-color-danger-normal);
		--v-button-background-color-hover: var(--g-color-danger-accent);
		--v-button-color: var(--g-color-danger-subtle);
		--v-button-color-hover: var(--g-color-danger-subtle);
	}
}
</style>
