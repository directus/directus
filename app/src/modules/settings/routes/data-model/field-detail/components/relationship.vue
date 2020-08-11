<template>
	<relationship-m2o :collection="collection" :type="type" v-if="type === 'm2o' || type === 'file'" />
	<relationship-o2m :collection="collection" :type="type" v-else-if="type === 'o2m'" />
	<relationship-m2m :collection="collection" :type="type" v-else-if="type === 'm2m' || type === 'files'" />
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Relation } from '@/types';
import { Field } from '@/types';

import RelationshipM2o from './relationship-m2o.vue';
import RelationshipO2m from './relationship-o2m.vue';
import RelationshipM2m from './relationship-m2m.vue';

export default defineComponent({
	components: {
		RelationshipM2o,
		RelationshipO2m,
		RelationshipM2m,
	},
	props: {
		type: {
			type: String,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
});
</script>
