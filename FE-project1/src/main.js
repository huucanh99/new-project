import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '/src/router/index.js'

// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCog } from '@fortawesome/free-solid-svg-icons'

// add icon vào thư viện
library.add(faCog)

// tạo app trước
const app = createApp(App)

// đăng ký global component
app.component('font-awesome-icon', FontAwesomeIcon)

// dùng pinia + router
app.use(createPinia())
app.use(router)

// mount
app.mount('#app')
