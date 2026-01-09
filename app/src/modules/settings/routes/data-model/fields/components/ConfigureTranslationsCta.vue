<script lang="ts" setup>
import { ref } from 'vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';

const dialogActive = ref(false);
</script>

<template>
	<VButton secondary @click="dialogActive = true">
		{{ $t('configure_translations') }}
	</VButton>

	<VDialog v-model="dialogActive">
		<VCard>
			<VCardTitle>
				Configure Translations
			</VCardTitle>
			<VCardText>
				Creates a new translations collection and does the plumbing and shit.
			</VCardText>
			<VCardActions>
				<VButton>GO</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
