<template>
	<div class="split">
		<div class="left">
			<v-checkbox-tree :search="search" :choices="choices" v-model="value" :value-combining="valueCombining" />
		</div>

		<div class="right">
			<p>Search</p>
			<input v-model="search" placeholder="Search..." />

			<p>Value Combining</p>

			<label>
				<input type="radio" value="all" v-model="valueCombining" />
				All
			</label>
			<label>
				<input type="radio" value="branch" v-model="valueCombining" />
				Branch
			</label>
			<label>
				<input type="radio" value="leaf" v-model="valueCombining" />
				Leaf
			</label>
			<label>
				<input type="radio" value="indeterminate" v-model="valueCombining" />
				Indeterminate
			</label>

			<pre>{{ value }}</pre>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const value = ref<string[]>([]);

const valueCombining = ref('all');

const search = ref('');

const choices = [
	{
		text: 'Fruits',
		value: 'fruits',
		children: [
			{
				text: 'Apple 🍎',
				value: 'apple',
				isNew: true,
			},
			{
				text: 'Grapes 🍇',
				value: 'grapes',
			},
			{
				text: 'Pear 🍐',
				value: 'pear',
			},
			{
				text: 'Strawberry 🍓',
				value: 'strawberry',
			},
			{
				text: 'Watermelon 🍉',
				value: 'watermelon',
			},
		],
	},
	{
		text: 'Vegetables',
		value: 'vegetables',
		children: [
			{
				text: 'Corn 🌽',
				value: 'corn',
			},
			{
				text: 'Carrot 🥕',
				value: 'carrot',
			},
			{
				text: 'Eggplant 🍆',
				value: 'eggplant',
			},
			{
				text: 'Tomato 🍅',
				value: 'tomato',
			},
		],
	},
	{
		text: 'Other',
		value: 'other',
		children: [
			{
				text: 'Egg 🥚',
				value: 'egg',
			},
			{
				text: 'Fastfood',
				value: 'fastfood',
				children: [
					{
						text: 'Hamburger 🍔',
						value: 'hamburger',
					},
					{
						text: 'Fries 🍟',
						value: 'fries',
					},
					{
						text: 'Milkshake 🥤',
						value: 'milkshake',
					},
				],
			},
			{
				text: 'Candy',
				value: 'candy',
				children: [
					{
						text: 'Cake 🎂',
						value: 'cake',
					},
					{
						text: 'Soft Serve 🍦',
						value: 'softserve',
					},
				],
			},
		],
	},
];
</script>

<style scoped>
pre {
	width: max-content;
	margin: 20px 0;
	background-color: #efefef;
}

.split {
	display: flex;
}

.split > * {
	flex-grow: 1;
}
</style>
