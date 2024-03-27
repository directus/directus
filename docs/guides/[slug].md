---
type: 'guides-index'
---

<script setup>
import GuidesSection from '@/components/guides/GuidesSection.vue'
</script>

<h1>{{ $params.title }}</h1>

<GuidesSection :section="$params" class="blocks" />

<style scoped>
.blocks {
  margin-top: 2em;
}
</style>
