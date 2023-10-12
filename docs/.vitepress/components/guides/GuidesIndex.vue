<script setup lang="ts">
import { data } from '../../data/guides.data.js';
import GuidesSection from './GuidesSection.vue';
</script>

<template>
	<section class="hero">
		<div>
			<h1>Directus Guides</h1>
			<p>Our official guides to help you get started, integrate, and make the most of Directus.</p>
		</div>
	</section>

	<div class="box">
		<h2>Getting Started</h2>
		<ul>
			<li v-for="item in data.guides.gettingStarted" :key="item.path">
				<a :href="item.path">{{ item.display }}</a>
			</li>
		</ul>
	</div>
	<section v-for="section in data.guides.sections" :key="section.indexPath">
		<h2>{{ section.title }}</h2>
		<GuidesSection :section="section" />
	</section>
</template>
