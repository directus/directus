---
layout: doc
prev: false
next: false
type: 'blog-post'
---

<script setup>
import { useData } from 'vitepress'
import Badge from '@/components/Badge.vue'
import PostMeta from '@/components/blog/PostMeta.vue'
const { params } = useData()
</script>

<Badge><a href="/blog/">Developer Blog</a></Badge>

<h1>{{ params.title }}</h1>

<PostMeta :params="params" />

<!-- @content -->
