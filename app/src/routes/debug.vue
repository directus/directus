<template>
	{{ value }}
	<v-checkbox-tree :choices="choices" v-model="value" />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const value = ref<string[]>([]);

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
];
</script>
