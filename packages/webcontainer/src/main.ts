import { createApp } from 'vue'
import './assets/main.scss'
import App from './App.vue'
import Terminal from './components/windows/Terminal.vue';
import Browser from './components/windows/Browser.vue';
import Explorer from './components/windows/Explorer.vue';
import Website from './components/windows/Website.vue';
import DirectusOS from './components/windows/DirectusOS.vue';
import Editor from './components/windows/Editor.vue';
import VFiles from './components/Files.vue';

const app = createApp(App)

app.component('Terminal', Terminal);
app.component('Browser', Browser);
app.component('Explorer', Explorer);
app.component('Website', Website);
app.component('DirectusOS', DirectusOS);
app.component('Editor', Editor);
app.component('VFiles', VFiles);

app.mount('#app')
