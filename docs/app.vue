<script setup>
useAppConfig()
provideHeadlessUseId(() => useId())
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
	</NuxtLayout>
</template>
