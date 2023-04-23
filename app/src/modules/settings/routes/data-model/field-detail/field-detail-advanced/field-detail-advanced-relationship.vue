<template>
	<relationship-m2o v-if="localType === 'm2o' || localType === 'file'" />
	<relationship-o2m v-else-if="localType === 'o2m'" />
	<relationship-m2m v-else-if="localType === 'm2m' || localType === 'files'" />
	<relationship-m2a v-else-if="localType === 'm2a'" />
	<relationship-translations v-else-if="localType === 'translations'" />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFieldDetailStore } from '../store';
import RelationshipM2a from './field-detail-advanced-relationship-m2a.vue';
import RelationshipM2m from './field-detail-advanced-relationship-m2m.vue';
import RelationshipM2o from './field-detail-advanced-relationship-m2o.vue';
import RelationshipO2m from './field-detail-advanced-relationship-o2m.vue';
import RelationshipTranslations from './field-detail-advanced-relationship-translations.vue';

const fieldDetailStore = useFieldDetailStore();

const { localType } = storeToRefs(fieldDetailStore);
</script>
