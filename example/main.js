import { createApp } from '../lib/guide-mini-vue.esm.js';
import { App } from './App02.js';

const rootContainer = document.getElementById('app');
createApp(App).mount(rootContainer)