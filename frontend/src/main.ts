import 'primevue/resources/themes/aura-dark-amber/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';

import Column from 'primevue/column';
import DataTable from 'primevue/datatable';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue);

app.component('DataColumn', Column);
app.component('DataTable', DataTable);

fetch(import.meta.env.BASE_URL + 'config.json')
   .then((response) => response.json())
   .then((config) => {
      for (const key in config) {
         app.provide(key, config[key])
      }
      app.mount('#app')
   })

