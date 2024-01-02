---
layout: page
title: Blog
description: Project tutorials, tips & tricks, and best practices from the Directus team and community.
---

<script setup>
import TagsIndex from '@/components/blog/TagsIndex.vue';
import BlogHero from '@/components/blog/BlogHero.vue';
import { useData } from 'vitepress';
const { params } = useData();
</script>

<BlogHero />
<TagsIndex :tag="params" />
