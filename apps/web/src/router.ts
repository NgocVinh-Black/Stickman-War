import { createRouter, createWebHashHistory } from 'vue-router';
import { auth } from './net/account';
import { useSettings } from './stores/settings';

/**
 * Hash history (#/…) để web tĩnh chạy dưới /stickman-war/ mà không cần cấu hình thêm cho nginx.
 * Màn đăng nhập hiện trước, trừ khi còn phiên Google hoặc đã chọn chơi khách trong lần mở trang này.
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: () => import('./views/LoginView.vue') },
    { path: '/', component: () => import('./views/LobbyView.vue') },
    { path: '/room', component: () => import('./views/RoomView.vue') },
    { path: '/play', component: () => import('./views/GameView.vue') },
    { path: '/world', component: () => import('./views/WorldDemoView.vue') },
    { path: '/map-demo', component: () => import('./views/MapDemoView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const settings = useSettings();
  const invite = new URLSearchParams(location.search).get('room');
  if (to.path === '/world' || to.path === '/map-demo') return true; // trang demo hình, không cần đăng nhập
  if (to.path !== '/login' && !auth.session && !settings.guest && !invite) return '/login';
  return true;
});
