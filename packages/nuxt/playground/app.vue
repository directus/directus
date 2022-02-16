<template>
	<div>
		<h1>Directus Nuxt Module Playground</h1>
		<h2>Module Config</h2>
		<ul>
			<li>
				<strong>url:</strong>
				{{ $directus.url }}
			</li>
			<li>
				<strong>auth:</strong>
				<pre>{{ $directus.auth }}</pre>
			</li>
		</ul>
		<h2>Server Info</h2>
		<pre>{{ serverInfo }}</pre>
	</div>
</template>

<script setup lang="ts">
const { $directus } = useNuxtApp();
const { data: serverInfo } = await useAsyncData('serverInfo', () => $directus.server.info());
</script>
