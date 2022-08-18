import '../../../app/src/styles/main.scss';

import { app } from "@storybook/vue3";
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
        }
    ],
});

import { createI18n } from 'vue-i18n';
import { register } from './register';

const i18n = createI18n();


export const parameters = {
    actions: { argTypesRegex: "^(change|click|update:.*?)" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    }, 
  }

app.use(router)
app.use(i18n)


register(app)