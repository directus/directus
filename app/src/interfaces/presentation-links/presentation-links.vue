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

<script setup lang="ts">
import { useItem } from '@/composables/use-item';
import { useCollection } from '@directus/composables';
import { RELATIONAL_TYPES } from '@directus/constants';
import { Query } from '@directus/types';
import { getFieldsFromTemplate } from '@directus/utils';
import { omit } from 'lodash';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs } from 'vue';

type Link = {
	icon: string;
	label: string;
	type: string;
	url?: string;
};

type Props = {
	links: Link[];
	collection: string;
	primaryKey: string;
};

const props = withDefaults(defineProps<Props>(), {
	links: () => [],
});

const values = inject('values', ref<Record<string, any>>({}));

const { collection, primaryKey } = toRefs(props);

const query = computed(() => {
	const fields = new Set();

	props.links.forEach((link) => {
		getFieldsFromTemplate(link.url ?? '').forEach((field) => fields.add(field));
	});

	return {
		fields: Array.from(fields),
	} as Query;
});

const { item } = useItem(collection, primaryKey, query);
const { fields } = useCollection(collection);

const fullItem = computed(() => {
	const itemValue = item.value ?? {};

	for (const field of fields.value) {
		if (
			field.meta?.special?.some((special) => RELATIONAL_TYPES.includes(special as (typeof RELATIONAL_TYPES)[number]))
		) {
			continue;
		}

		itemValue[field.field] = values.value[field.field];
	}

	return itemValue;
});

const linksParsed = computed(() => {
	return props.links.map((link) => {
		const parsedLink = omit<Record<string, any>>(link, ['url']);
		const linkValue = render(link.url ?? '', fullItem.value ?? {});

		if (linkValue.startsWith('/')) {
			parsedLink.to = linkValue;
		} else {
			parsedLink.href = linkValue;
		}

		return parsedLink;
	});
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
