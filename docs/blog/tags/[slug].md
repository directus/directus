---
layout: page
---

<script setup>
import { useData } from 'vitepress'
const { params } = useData()
import TagsIndex from '../../.vitepress/components/blog/TagsIndex.vue'
import BlogHero from '../../.vitepress/components/blog/BlogHero.vue'
</script>

<BlogHero />
<TagsIndex :tag="params" />
