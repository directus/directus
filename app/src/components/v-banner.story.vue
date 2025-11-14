<script setup lang="ts">
import { ref } from 'vue';
import VBanner from './v-banner.vue';

const icon = ref('person');
</script>

<template>
	<Story title="VBanner">
		<VBanner :icon>
			<h2 class="name">Nils Twelker</h2>

			<template #subtitle>
				<p class="meta">
					<span>
						<v-icon class="icon" small name="location_on" />
						🇳🇴 Norway
					</span>
					<span>
						<v-icon class="icon" small name="work" />
						Directus
					</span>
				</p>
			</template>
		</VBanner>

		<template #controls>
			<HstText v-model="icon" title="Icon" />
		</template>
	</Story>
</template>
