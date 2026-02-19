<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import Plane from './plane.vue';
</script>

<template>
	<TresCanvas clear-color="#0e1c2f">
		<TresPerspectiveCamera :position="[0, 0, 8]" />
		<Plane />
	</TresCanvas>
</template>
