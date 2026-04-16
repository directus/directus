<script setup lang="ts">
import { setAttr } from '@directus/visual-editing';
import { CheckCircle2 } from 'lucide-vue-next';
import Button from '../base/BaseButton.vue';

interface PricingCardProps {
	card: {
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
	};
}

defineProps<PricingCardProps>();
</script>

<template>
	<div
		:class="[
			'flex flex-col max-w-[600px] md:min-h-[424px] border rounded-lg p-6',
			card.is_highlighted ? 'border-accent' : 'border-input',
		]"
		:data-directus="setAttr({ collection: 'block_pricing_cards', item: card.id })"
	>
		<div class="flex justify-between items-start gap-2 mb-4">
			<h3 class="text-xl font-heading text-foreground">
				{{ card.title }}
			</h3>
			<div class="flex-shrink-0">
				<Badge
					v-if="card.badge"
					:variant="card.is_highlighted ? 'secondary' : 'default'"
					class="text-xs font-medium uppercase"
				>
					{{ card.badge }}
				</Badge>
			</div>
		</div>

		<p v-if="card.price" class="text-h2 mt-2 font-semibold">
			{{ card.price }}
		</p>

		<p v-if="card.description" class="text-description mt-2 line-clamp-2">
			{{ card.description }}
		</p>

		<hr class="my-4" />

		<div class="flex-grow">
			<ul v-if="card.features" class="space-y-4">
				<li v-for="(feature, index) in card.features" :key="index" class="flex items-center gap-3 text-regular">
					<CheckCircle2 class="w-4 h-4 text-gray-muted mt-1" />
					<p class="leading-relaxed">{{ feature }}</p>
				</li>
			</ul>
		</div>

		<div class="mt-auto pt-4">
			<Button
				v-if="card.button"
				id="card.button.uuid"
				:label="card.button.label"
				:variant="card.button.variant"
				:url="card.button.url"
				block
			/>
		</div>
	</div>
</template>
