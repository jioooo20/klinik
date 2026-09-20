import axios from 'axios';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Kirim cookie (termasuk XSRF-TOKEN) pada setiap request same-origin, dan
// pastikan axios menerjemahkan cookie XSRF-TOKEN menjadi header X-XSRF-TOKEN.
// Tanpa ini, request yang mengubah state (mis. logout) bisa kehilangan token
// CSRF dan ditolak dengan 419 "Page Expired".
window.axios.defaults.withCredentials = true;
window.axios.defaults.withXSRFToken = true;