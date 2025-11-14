<script setup lang="ts">
import { Field } from '@directus/types';
// import VForm from './v-form.vue';

const fields = [
	{
		collection: 'a',
		field: 'fieldA',
		meta: {},
		name: 'FieldA',
		schema: {},
		type: 'boolean',
	} as Field,
];

function noOp() {}

if (typeof window.URL.createObjectURL === 'undefined') {
	Object.defineProperty(window.URL, 'createObjectURL', { value: noOp });
}
</script>

<template>
	<Story title="VForm">
		TBD
		<!-- <v-form :fields /> -->
	</Story>
</template>
