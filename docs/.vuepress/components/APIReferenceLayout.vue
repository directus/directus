<template>
  <div
    class="theme-container"
    :class="pageClasses"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <Navbar
      v-if="shouldShowNavbar"
      @toggle-sidebar="toggleSidebar"
    />

    <div
      class="sidebar-mask"
      @click="toggleSidebar(false)"
    />

    <Sidebar
      :items="sidebarItems"
      @toggle-sidebar="toggleSidebar"
    >
      <template #top>
        <slot name="sidebar-top" />
      </template>
      <template #bottom>
        <slot name="sidebar-bottom" />
      </template>
    </Sidebar>

    <main class="page">
      <div class="theme-default-content content__default">
        <h1>{{ $page.frontmatter.tag.name }}</h1>
        
        <section>
          <div class="two-up">
            <div class="left">
              <div v-html="micromark($page.frontmatter.tag.description)" />
            </div>

            <aside class="right">
              <InfoBox title="endpoints">
                <dl class="endpoints">
                  <div v-for="endpoint of endpoints" :key="endpoint.operationId">
                    <dt>{{ endpoint.method.toUpperCase() }}</dt>
                    <dd>{{ endpoint.url }}</dd>
                  </div>
                </dl>
              </InfoBox>
            </aside>
          </div>
        </section>

        <section v-if="schemaComponent && schemaComponent.properties">
          <h2>The {{ $page.frontmatter.tag.name }} Object</h2>

          <div class="two-up">
            <div class="left">
              <DefinitionList>
                <div v-for="(propertyInfo, property) of schemaComponent.properties" :key="property">
                  <h4>{{ property }} <DefinitionType>{{ propertyInfo.type || (propertyInfo.oneOf && propertyInfo.oneOf[0] && propertyInfo.oneOf[0].type) || '???' }}</DefinitionType></h4>
                  <div v-if="propertyInfo.description" v-html="micromark(propertyInfo.description)" />
                </div>
              </DefinitionList>
            </div>

            <div class="right">
              <InfoBox :title="`${$page.frontmatter.tag.name} Object`">
                <pre class="language-json"><code>{{ schemaComponentObjectExample }}</code></pre>
              </InfoBox>
            </div>
          </div>
        </section>

        <section v-for="endpoint of endpoints" :key="endpoint.operationId">
          <h2>{{ endpoint.summary }}</h2>

          <div class="two-up">
            <div class="left">
              <div v-html="micromark(endpoint.description)" />

              <template v-if="endpoint.parameters && endpoint.parameters.length > 0">
                <h3>Parameters</h3>
                <DefinitionList>
                  <div v-for="parameter of endpoint.parameters" :key="parameter.name">
                    <h4>{{ parameter.name }} <DefinitionType>{{ parameter.schema.type }}</DefinitionType></h4>
                    <div v-if="parameter.description" v-html="micromark(parameter.description)" />
                  </div>
                </DefinitionList>
              </template>

              <template v-if="endpoint.query && endpoint.query.length > 0">
                <h3>Query</h3>
                <DefinitionList>
                  <div v-for="query of endpoint.query" :key="query.name">
                    <h4>{{ query.name }} <DefinitionType>{{ query.schema.type }}</DefinitionType></h4>
                    <div v-if="query.description" v-html="micromark(query.description)" />
                    <a :href="`/reference/api/query/${query.name}`">Learn More</a>
                  </div>
                </DefinitionList>
              </template>
            </div>

            <div class="right">
              <InfoBox title="endpoint">
                <dl class="endpoints">
                  <div>
                    <dt>{{ endpoint.method.toUpperCase() }}</dt>
                    <dd>{{ endpoint.url }}</dd>
                  </div>
                </dl>
              </InfoBox>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import Layout from '@theme/layouts/Layout.vue';
import specs from '@directus/specs';
import micromark from 'micromark';
import get from 'lodash.get';
import InfoBox from './InfoBox.vue';
import DefinitionList from './DefinitionList.vue';
import DefinitionType from './DefinitionType.vue';

export default {
    components: { Layout, InfoBox, DefinitionList, DefinitionType },
    extends: Layout,
    computed: {
      endpoints() {
        const tag = this.$page.frontmatter.tag.name;
        const endpoints = [];

        for (const [url, urlInfo] of Object.entries(specs.paths)) {
          for (const [method, operation] of Object.entries(specs.paths[url])) {
            if (operation.tags?.includes(tag) !== true) continue;

            const endpoint = {
              ...operation,
              url,
              method,
              query: operation.parameters,
              parameters: urlInfo.parameters
            };

            endpoints.push(this.deref(endpoint));
          }
        }

        return endpoints;
      },
      schemaComponent() {
        const tag = this.$page.frontmatter.tag.name;
        return this.deref(specs.components.schemas[tag]);
      },
      schemaComponentObjectExample() {
        if (!this.schemaComponent) return null;

        const example = {};

        for (const [key, info] of Object.entries(this.schemaComponent.properties)) {
          example[key] = info.example;
        }

        return JSON.stringify(example, null, 2);
      }
    },
    methods: {
      micromark,
      deref(object) {
        object = { ...object };
        return deref(object, 0);

        function deref(object, level) {
          object = {...object};

          if (isObject(object) === false) return object;
          if (level > 3) return object;

          if ('$ref' in object) {
            const path = object.$ref.substring(2).replace(/\//g, '.');
            return deref(get(specs, path), level + 1);
          }

          for (const [key, value] of Object.entries(object)) {
            if (isArray(value)) {
              object[key] = value.map(val => isObject(val) ? deref(val, level + 1) : val);
            } else if (isObject(value)) {
              if ('$ref' in value) {
                const path = value.$ref.substring(2).replace(/\//g, '.');
                object[key] = deref(get(specs, path), level + 1);
              } else {
                object[key] = deref(value, level + 1);
              }
            } else {
              continue;
            }
          }

          return object;
        }

        function isObject(value) {
          return Object.prototype.toString.call(value) === '[object Object]';
        }

        function isArray(value) {
          return Array.isArray(value);
        }
      }
    },
};
</script>

<style scoped>
.page-content {
	display: block;
	padding-bottom: 2rem;
}

.theme-default-content {
	max-width: 1200px;
}

.content__default section {
	margin-bottom: 2rem;
	padding-bottom: 2rem;
	border-bottom: 1px solid #f0f4f9;
}

.content__default section h2 {
	border-bottom: 0;
}

@media (min-width: 1174px) {
	.content__default .two-up {
		display: grid;
		grid-gap: 3em;
		grid-template-columns: minmax(0, 4fr) minmax(0, 3fr);
		align-items: flex-start;
	}

	.content__default .right {
		position: sticky;
		top: 80px;
	}
}

.endpoints {
	font-size: 0.8em;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
}

.endpoints div > * {
	display: inline-block;
}

.endpoints div dt {
	width: 8ch;
	margin-right: 1ch;
	text-align: right;
}

.endpoints div dd {
	margin: 0;
}
</style>