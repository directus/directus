<script setup lang="ts">
import { setAttr } from '@directus/visual-editing';

interface PricingProps {
	data: {
		id: string;
		tagline?: string;
		headline?: string;
		pricing_cards: Array<{
			id: string;
			title: string;
			description?: string;
			price?: string;
			badge?: string;
			features?: string[];
			button?: {
				id: string;
				label: string | null;
				variant: string | null;
				url: string | null;
			};
			is_highlighted?: boolean;
		}>;
	};
}

defineProps<PricingProps>();
</script>

<template>
	<section>
		<div v-if="data.tagline || data.headline">
			<Tagline
				v-if="data.tagline"
				:tagline="data.tagline"
				:data-directus="setAttr({ collection: 'block_pricing', item: data.id, fields: 'tagline', mode: 'popover' })"
			/>
			<Headline
				v-if="data.headline"
				:headline="data.headline"
				:data-directus="setAttr({ collection: 'block_pricing', item: data.id, fields: 'headline', mode: 'popover' })"
			/>
		</div>

		<div
			class="grid gap-6 mt-8"
			:class="{
				'grid-cols-1': data.pricing_cards.length === 1,
				'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': data.pricing_cards.length % 3 === 0,
				'grid-cols-1 sm:grid-cols-2': data.pricing_cards.length % 3 !== 0 && data.pricing_cards.length !== 1,
			}"
		>
			<PricingCard v-for="card in data.pricing_cards" :key="card.id" :card="card" />
		</div>
	</section>
</template>
