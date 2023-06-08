<template>
	<div>
		<div class="tab-code-buttons">
			<button
				v-for="(tab, index) in tabs"
				:key="index"
				:class="{ active: activeTab === index }"
				@click="changeTab(index)"
			>
				{{ tab }}
			</button>
		</div>

		<div class="tab-code-content no-scroll">
			<div v-show="activeTab === 0">
				<HighCode
					class="code-block"
					lang="sql"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue="
SELECT id, status, title, category, images.id, images.name, date_added
FROM articles
LEFT JOIN images
WHERE articles.image = images.id;"
				/>

				<HighCode
					class="code-block"
					lang="sql"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue="
id   status     title             category     images.id    images.name           date_added
4    review     Pink Crystals     random       311          pink-crystals.png     2020-11-12 17:56:41"
				/>
			</div>

			<div v-show="activeTab === 1">
				<HighCode
					class="code-block tab-2"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue="
GET /items/products/4?fields=*,image.id,image.name"
				/>

				<HighCode
					class="code-block tab-2-result"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue='
{
	"id": 4,
	"status": "review",
	"title": "Pink Crystals",
	"category": "random",
	"image": {
		"id": 311,
		"name": "pink-crystals.png"
	},
	"date_added": "2020-11-12T17:56:41Z"
}'
				/>
			</div>

			<div v-show="activeTab === 2">
				<HighCode
					class="code-block tab-3"
					lang="GraphQL"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue="
query {
	articles_by_id(id: 4) {
		id
		status
		title
		category
		image {
			id
			name
		}
		date_added
	}
}"
				/>

				<HighCode
					class="code-block"
					lang="GraphQL"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue='
{
	"id": 4,
	"status": "review",
	"title": "Pink Crystals",
	"category": "random",
	"image": {
		"id": 311,
		"name": "pink-crystals.png"
	},
	"date_added": "2020-11-12T17:56:41Z"
}'
				/>
			</div>

			<div v-show="activeTab === 3">
				<HighCode
					class="code-block"
					lang="javascript"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue='
await directus.items("articles").readOne(4, {
	fields: ["id", "status", "title", "category", "image.id", "image.name", "date_added"]
});'
				/>
				<HighCode
					class="code-block"
					lang="javascript"
					width="100%"
					height="auto"
					:copy="false"
					fontSize="15px"
					:codeLines="false"
					:scrollStyleBool="true"
					codeValue='
{
	"id": 4,
	"status": "review",
	"title": "Pink Crystals",
	"category": "random",
	"image": {
		"id": 311,
		"name": "pink-crystals.png"
	},
	"date_added": "2020-11-12T17:56:41Z"
}'
				/>
			</div>
		</div>
	</div>
</template>

<style>
.tab-code-buttons {
	background: #f0f4f9;
	border: 1px solid #d3dae4;
	border-radius: 8px 8px 0 0;
	display: flex;
	/* justify-content: space-evenly; */
	text-align: left;
}

.tab-code-buttons button {
	padding: 10px 20px;
	margin: 0 5px;
	border: none;
	cursor: pointer;
	color: #a2b5cd;
	font-size: 16px;
	font-weight: 600;
}

.tab-code-buttons button.active {
	color: #64f;
}

.tab-code-content {
	margin: 20px;
	max-height: 420px;
	overflow-y: auto;
}
.no-scroll,
pre[data-v-f4a493be] {
	-ms-overflow-style: none;
	scrollbar-width: none;
	overflow-y: scroll;
}
.no-scroll::-webkit-scrollbar,
pre[data-v-f4a493be]::-webkit-scrollbar {
	display: none;
}
</style>

<script>
import { HighCode } from 'vue-highlight-code';
import './code-highlight.css';

export default {
	components: {
		HighCode,
	},
	data() {
		return {
			activeTab: 0,
			tabs: ['SQL', 'REST', 'GraphQL', 'SDK'],
		};
	},
	methods: {
		changeTab(index) {
			this.activeTab = index;
		},
	},
};
</script>
