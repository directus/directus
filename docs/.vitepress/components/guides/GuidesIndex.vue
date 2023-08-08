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
      <li v-for="item in gettingStarted">
        <a :href="item.path">{{ item.display }}</a>
      </li>
    </ul>
  </div>
  <section v-for="section in sections">
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
const gettingStarted = [
  { display: 'Quickstart Guide', path: '/getting-started/quickstart' },
  { display: 'Self-Hosted Installation', path: '/self-hosted/quickstart' },
  { display: 'Get Started With The SDK', path: '/guides/sdk/getting-started' },
]

const sections = [
  {
    title: 'Framework Guides',
    cols: 2,
    blocks: [
      {
        title: 'Next.js',
        items: [
          { display: 'Build a Website With Next.js', path: '/guides/headless-cms/build-static-website/next-13' },
          { display: 'Set Up Live Preview With Next.js', path: '/guides/headless-cms/live-preview/nextjs' },
        ]
      },
      {
        title: 'Nuxt',
        items: [
          { display: 'Build a Website With Nuxt', path: '/guides/headless-cms/build-static-website/nuxt-3' },
          { display: 'Set Up Live Preview With Nuxt', path: '/guides/headless-cms/live-preview/nuxt-3' },
        ]
      },
    ],
  },
  {
    title: 'Use Case Guides',
    cols: 1,
    blocks: [
      {
        title: 'Headless CMS',
        items: [
          { display: 'Build Content Approval Workflows', path: '/guides/headless-cms/approval-workflows' },
          { display: 'Create Re-Usable Page Components', path: '/guides/headless-cms/reusable-components' },
          { display: 'Create Content Translations', path: '/guides/headless-cms/content-translations' },
          { display: 'Schedule Future Content', paths: [ 
            { label: 'Static Sites', path: '/guides/headless-cms/schedule-content/static-sites' } ,
            { label: 'Dynamic Sites', path: '/guides/headless-cms/schedule-content/dynamic-sites' } ,
          ]},
          { display: 'Trigger Site Builds', paths: [ 
            { label: 'Netlify', path: '/guides/headless-cms/trigger-static-builds/netlify' } ,
            { label: 'Vercel', path: '/guides/headless-cms/trigger-static-builds/vercel' } ,
          ]},
        ]
      },
    ],
  },
  {
    title: 'Realtime Guides',
    cols: 1,
    blocks: [
      {
        title: 'Concepts',
        items: [
          { display: 'Getting Started With Realtime', paths: [ 
            { label: 'WebSockets', path: '/guides/real-time/getting-started/websockets' } ,
            { label: 'GraphQL', path: '/guides/real-time/getting-started/graphql' } ,
          ]},
          { display: 'Authentication', path: '/guides/real-time/authentication' },
          { display: 'Operations', path: '/guides/real-time/operations' },
          { display: 'Subscriptions', paths: [ 
            { label: 'WebSockets', path: '/guides/real-time/subscriptions/websockets' } ,
            { label: 'GraphQL', path: '/guides/real-time/subscriptions/graphql' } ,
          ]},
        ]
      },
      {
        title: 'Projects',
        items: [
          { display: 'Build a Multi-User Chat', paths: [ 
            { label: 'JavaScript', path: '/guides/real-time/chat/javascript' } ,
            { label: 'React', path: '/guides/real-time/chat/react' } ,
            { label: 'Vue', path: '/guides/real-time/chat/vue' } ,
          ]},
          { display: 'Build a Live Poll Result', path: '/guides/real-time/live-poll' },
        ]
      },
    ],
  },
  {
    title: 'Extensions',
    cols: 2,
    blocks: [
      {
        title: 'Displays',
        items: [
          { display: 'Use Displays To Format Date As An Age', path: '/guides/extensions/displays-date-to-age' },
          { display: 'Use Displays To Summarize Relational Items', path: '/guides/extensions/displays-relational-summaries' },
        ]
      },
      {
        title: 'Endpoints',
        items: [
          { display: 'Use Custom Endpoints to Create an API Proxy', path: '/guides/extensions/endpoints-api-proxy-twilio' },
          { display: 'Use Custom Endpoints to Create Privileged API Endpoints', path: '/guides/extensions/endpoints-privileged-endpoint-stripe' },
        ]
      },
      {
        title: 'Email Templates',
        items: [
          { display: 'Create An Email Template With Dynamic Values', path: '/guides/extensions/email-template' },
        ]
      },
      {
        title: 'Hooks',
        items: [
          { display: 'Use Hooks to Create Stripe Customers', path: '/guides/extensions/hooks-add-stripe-customer' },
          { display: 'Use Hooks to Validate Phone Numbers With Twilio', path: '/guides/extensions/hooks-validate-number-twilio' },
        ]
      },
      {
        title: 'Interfaces',
        items: [
          { display: 'Create A Radio Selector With Icons, SVG, or Images', path: '/guides/extensions/interfaces-radio-selector-icons' },
          { display: 'Create A Searchable Dropdown With Items From Another Collection', path: '/guides/extensions/interfaces-relational-dropdown' },
        ]
      },
      {
        title: 'Layouts',
        items: [
          { display: 'Create Your First Layout Extension', path: '/guides/extensions/layouts-getting-started' },
        ]
      },
      {
        title: 'Operations',
        items: [
          { display: 'Use Custom Operations to Send Bulk Email With SendGrid', path: '/guides/extensions/operations-bulk-email-sendgrid' },
          { display: 'Use Custom Operations to Add an Item Comment', path: '/guides/extensions/operations-add-record-comments' },
          { display: 'Use Custom Operations to Send SMS Notifications With Twilio', path: '/guides/extensions/operations-send-sms-twilio' },
        ]
      },
      {
        title: 'Panels',
        items: [
          { display: 'Create An Interactive Panel To Send SMS With Twilio', path: '/guides/extensions/panels-send-sms-twilio' },
        ]
      },
    ]
  },
  {
    title: 'Administration',
    cols: 1,
    blocks: [
      {
        title: 'Migrations',
        items: [
          { display: 'Migrate Your Data Model', paths: [ 
            { label: 'Node.js', path: '/guides/migration/node' },
            { label: 'Hoppscotch', path: '/guides/migration/hoppscotch' },
          ]},
        ]
      },
    ],
  },
]
</script>