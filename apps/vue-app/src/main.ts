import './styles.scss';
import router from './router';
import { createApp } from 'vue';
import App from './app/App.vue';
import { connectBridge } from './mfe-bridge';

const bridge = connectBridge(router);

const app = createApp(App);
app.provide('bridge', bridge);
app.use(router);
app.mount('#root');
