<script setup lang="ts">
import { useApi } from '@directus/composables';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { render } from 'micromustache';
import { computed, inject, ref, watch } from 'vue';

type Link = {
	icon: string;
	label: string;
	type: string;
	url?: string;
};

type ParsedLink = Omit<Link, 'url'> & {
	to?: string;
	href?: string;
};

type Props = {
	links: Link[];
	collection: string;
	primaryKey: string;
};

const props = withDefaults(defineProps<Props>(), {
	links: () => [],
});

const api = useApi();
const values = inject('values', ref<Record<string, any>>({}));
const resolvedRelationalValues = ref<Record<symbol, any>>({});

/**
 * Get all deduplicated relational fields from the link-templates.
 * For example:
 * [ "related.field", "languages.code" ]
 */
const relatedFieldsFromTemplates = computed(
	() =>
		props.links
			?.flatMap((link) => {
				if (!link.url) return [];
				return (
					getFieldsFromTemplate(link.url)
						// filter out any duplicates for this link
						.filter((value, index, array) => array.indexOf(value) === index)
						// filter out non-relations, since they should be included in the values already
						.filter((value) => value.includes('.'))
				);
			})
			// filter out any duplicates between all links
			.filter((value, index, array) => array.indexOf(value) === index),
);

watch(relatedFieldsFromTemplates, async () => {
	// No need to fetch if we're creating a new item
	if (props.primaryKey === '+') return;

	try {
		const response = await api.get(`${getEndpoint(props.collection)}/${props.primaryKey}`, {
			params: {
				fields: relatedFieldsFromTemplates.value,
			},
		});

		resolvedRelationalValues.value = response.data.data;
	} catch (err) {
		// eslint-disable-next-line no-console
		console.warn('Presentation-Link: Fetching related fields failed');
	}
});

const linksParsed = computed(
	() =>
		props.links?.map((link) => {
			// Resolve related fields for interpolation
			// If the vform has the related fields inside we use them
			// because those represent the current unstaged edits
			// Else we use API responses to resolve those
			const scope: Record<symbol, any> = Object.keys(resolvedRelationalValues.value).some(
				(key) => typeof values.value[key] === 'object',
			)
				? { ...resolvedRelationalValues.value, ...values.value }
				: { ...values.value, ...resolvedRelationalValues.value };

			const interpolatedUrl = link.url ? render(link.url, scope) : '';

			// Preserving previous behaviour
			const isInternalLink = interpolatedUrl?.startsWith('/');

			return {
				icon: link.icon,
				type: link.type,
				label: link.label,
				to: isInternalLink ? interpolatedUrl : undefined,
				href: isInternalLink ? undefined : interpolatedUrl,
			} satisfies ParsedLink;
		}),
);
</script>

<template>
	<div class="presentation-links">
		<v-button
			v-for="(link, index) in linksParsed"
			:key="index"
			class="action"
			:class="[link.type]"
			:secondary="link.type !== 'primary'"
			:icon="!link.label"
			:href="link.href"
			:to="link.to"
		>
			<v-icon v-if="link.icon" left :name="link.icon" />
			<span v-if="link.label">{{ link.label }}</span>
		</v-button>
	</div>
</template>

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
		--v-button-background-color: var(--theme--success);
		--v-button-background-color-hover: var(--success-125);
		--v-button-color: var(--success-alt);
		--v-button-color-hover: var(--success-alt);
	}

	&.warning {
		--v-button-background-color: var(--theme--warning);
		--v-button-background-color-hover: var(--warning-125);
		--v-button-color: var(--warning-alt);
		--v-button-color-hover: var(--warning-alt);
	}

	&.danger {
		--v-button-icon-color: var(--white);
		--v-button-background-color: var(--theme--danger);
		--v-button-background-color-hover: var(--danger-125);
		--v-button-color: var(--danger-alt);
		--v-button-color-hover: var(--danger-alt);
	}
}
</style>
