---
layout: doc
editLink: false
prev: false
next: false
---

<script setup>
import { useData } from 'vitepress'
import { getFriendlyDate } from '../.vitepress/utils/time.js';
import Avatar from '../.vitepress/components/Avatar.vue'
import Badge from '../.vitepress/components/Badge.vue'
const { params } = useData()
</script>

<Badge>Developer Blog</Badge>

<h1>{{ params.title }}</h1>
<p>{{ params.summary }}</p>

<Avatar :image="`https://marketing.directus.app/assets/${params.user_created.avatar}?key=circle`" :name="params.user_created.first_name + ' ' + params.user_created.last_name" :title="params.user_created.title ?? 'Contributor'" />

<hr />

<!-- @content -->
