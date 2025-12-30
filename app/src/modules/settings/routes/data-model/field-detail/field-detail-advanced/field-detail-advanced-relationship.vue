<script setup lang="ts">
import { useFieldDetailStore } from '../store';
import RelationshipM2a from './field-detail-advanced-relationship-m2a.vue';
import RelationshipM2m from './field-detail-advanced-relationship-m2m.vue';
import RelationshipM2o from './field-detail-advanced-relationship-m2o.vue';
import RelationshipO2m from './field-detail-advanced-relationship-o2m.vue';
import RelationshipTranslations from './field-detail-advanced-relationship-translations.vue';
import { storeToRefs } from 'pinia';

const fieldDetailStore = useFieldDetailStore();

const { localType } = storeToRefs(fieldDetailStore);
</script>

<template>
	<RelationshipM2o v-if="localType === 'm2o' || localType === 'file'" />
	<RelationshipO2m v-else-if="localType === 'o2m'" />
	<RelationshipM2m v-else-if="localType === 'm2m' || localType === 'files'" />
	<RelationshipM2a v-else-if="localType === 'm2a'" />
	<RelationshipTranslations v-else-if="localType === 'translations'" />
</template>
