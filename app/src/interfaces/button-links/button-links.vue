<template>
	<div class="button-links">
		<v-button
			v-for="(link, index) in linksParsed"
			:key="index"
			class="action"
			:class="[link.type]"
			:secondary="link.type !== 'primary'"
			:disabled="disabled"
			:icon="!link.label"
			:href="link.url"
		>
			<v-icon left v-if="link.icon" :name="link.icon" />
			<span v-if="link.label">{{ link.label }}</span>
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, inject, computed } from '@vue/composition-api';
import { render } from 'micromustache';

type Link = {
	icon: string;
	label: string;
	type: string;
	url: string;
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
			return props.links.map((link) => ({
				...link,
				url: render(link.url, values.value),
			}));
		});

		return {
			linksParsed,
		};
	},
});
</script>

<style lang="scss" scoped>
.button-links {
	display: flex;
	flex-wrap: wrap;
}

.action {
	& + & {
		margin-left: 8px;
	}

	&.info {
		--v-button-icon-color: var(--white);
		--v-button-background-color: var(--primary);
		--v-button-background-color-hover: var(--primary-110);
		--v-button-color: var(--white);
		--v-button-color-hover: var(--white);
	}

	&.success {
		--v-button-icon-color: var(--white);
		--v-button-background-color: var(--success);
		--v-button-background-color-hover: var(--success-110);
		--v-button-color: var(--white);
		--v-button-color-hover: var(--white);
	}

	&.warning {
		--v-button-icon-color: var(--white);
		--v-button-background-color: var(--warning);
		--v-button-background-color-hover: var(--warning-110);
		--v-button-color: var(--white);
		--v-button-color-hover: var(--white);
	}

	&.danger {
		--v-button-icon-color: var(--white);
		--v-button-background-color: var(--danger);
		--v-button-background-color-hover: var(--danger-110);
		--v-button-color: var(--white);
		--v-button-color-hover: var(--white);
	}
}
</style>
