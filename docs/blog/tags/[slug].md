---
layout: page
title: Blog
description: Project tutorials, tips & tricks, and best practices from the Directus team and community.
---

<script setup>
import { useData } from 'vitepress'
const { params } = useData()
import TagsIndex from '../../.vitepress/components/blog/TagsIndex.vue'
import BlogHero from '../../.vitepress/components/blog/BlogHero.vue'
</script>

<BlogHero />
<TagsIndex :tag="params" />
