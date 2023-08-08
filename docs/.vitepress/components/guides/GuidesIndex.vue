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
      <li v-for="item in data.guides.gettingStarted">
        <a :href="item.path">{{ item.display }}</a>
      </li>
    </ul>
  </div>
  <section v-for="section in data.guides.sections">
    <h2>{{ section.title }}</h2>
    <div class="boxes" :style="`column-count: ${section.cols}`">
      <div v-for="block of section.blocks" class="box">
        <h3>{{ block.title }}</h3>
        <ul>
          <li v-for="item in block.items">
            <a v-if="item.path" :href="item.path">{{ item.display }}</a>
            <span v-else>
              <span>{{ item.display }}</span>
              <a v-for="variant of item.paths" :href="variant.path">{{ variant.label }}</a>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style>
.boxes {
  column-gap: 20px;
}
.box {
  break-inside: avoid;
  margin-bottom: 20px;
  border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	padding: 24px;
}
.box h2, .box h3 {
  margin-top: 0;
  padding-top: 0;
  border: none;
}
.box ul {
  margin-bottom: 0;
}
.box a {
  font-weight: inherit;
}
.box li span a {
  margin-left: 0.5em;
}

@media screen and (max-width: 1200px) {
  .boxes {
    column-count: 1 !important;
  }
}
</style>

<script setup lang="ts">
import { data } from '../../data/guides.data.js';
</script>