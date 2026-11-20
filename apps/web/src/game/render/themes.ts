import type { FactionId } from '@stickman-war/core';

/** Kiểu hạt bay trang trí nền (vẽ không cần lưu trạng thái, tính theo thời gian). */
export type Deco = 'none' | 'snow' | 'embers' | 'leaves' | 'petals' | 'bubbles' | 'dust' | 'smoke';

/**
 * Phong cảnh chiến trường của từng nền văn minh: trời, mặt trời / trăng, 3 dãy núi (xa → gần), cỏ, đất,
 * màu đá tượng. Nửa bản đồ nhà mỗi bên vẽ theo nền văn minh bên đó.
 * Giữ đất và núi gần đủ sáng để stickman mực đen vẫn nổi rõ.
 */
export type Theme = {
  sky: [string, string, string];
  sun: string;
  ridges: [string, string, string];
  /** Biên độ núi (núi đá cao, đồi cát thấp…). */
  amp: number;
  grass: [string, string];
  dirt: [string, string];
  stone: string;
  stoneDark: string;
  deco: Deco;
};

export const THEMES: Record<FactionId, Theme> = {
  tribe: {
    sky: ['#f7d9a8', '#f3e5c6', '#e8dcc0'],
    sun: 'rgba(255, 196, 92, 0.75)',
    ridges: ['#cdb79b', '#b39b7e', '#8f8a5c'],
    amp: 1,
    grass: ['#7c9a4a', '#6b8740'],
    dirt: ['#a88b5f', '#7d6443'],
    stone: '#9aa7b8',
    stoneDark: '#5d6a7c',
    deco: 'none',
  },
  orc: {
    sky: ['#e9b07e', '#f0c79c', '#e6c39e'],
    sun: 'rgba(255, 120, 50, 0.8)',
    ridges: ['#c29470', '#a3765a', '#7b6a3a'],
    amp: 1.2,
    grass: ['#76802f', '#646d28'],
    dirt: ['#a07750', '#6e5034'],
    stone: '#86705a',
    stoneDark: '#4f3f30',
    deco: 'dust',
  },
  elf: {
    sky: ['#c9ead6', '#e6f4e0', '#dcebcf'],
    sun: 'rgba(255, 244, 180, 0.85)',
    ridges: ['#a6cfa0', '#78ad74', '#4f8a4d'],
    amp: 1.1,
    grass: ['#56a23f', '#468a33'],
    dirt: ['#8f7b50', '#625235'],
    stone: '#8fa877',
    stoneDark: '#536b45',
    deco: 'leaves',
  },
  undead: {
    sky: ['#8f88a6', '#b3abc2', '#c6becc'],
    sun: 'rgba(240, 236, 250, 0.9)',
    ridges: ['#a59eb3', '#8a839a', '#6f6f66'],
    amp: 1,
    grass: ['#6a7258', '#58604a'],
    dirt: ['#8a7f72', '#5c534a'],
    stone: '#d6cfbc',
    stoneDark: '#8a8372',
    deco: 'dust',
  },
  samurai: {
    sky: ['#ffd6cc', '#ffece2', '#f7e2d4'],
    sun: 'rgba(229, 72, 77, 0.8)',
    ridges: ['#dcbab2', '#bb998d', '#86915f'],
    amp: 1.3,
    grass: ['#7ea04c', '#6b8740'],
    dirt: ['#b39272', '#7f6646'],
    stone: '#b4524a',
    stoneDark: '#6a2c25',
    deco: 'petals',
  },
  viking: {
    sky: ['#c6d6e5', '#dfe8ef', '#e6ece8'],
    sun: 'rgba(255, 232, 186, 0.75)',
    ridges: ['#a7b7c6', '#83959f', '#627560'],
    amp: 1.4,
    grass: ['#62804a', '#526e3e'],
    dirt: ['#8f7f66', '#625543'],
    stone: '#957255',
    stoneDark: '#5e4732',
    deco: 'none',
  },
  desert: {
    sky: ['#ffd493', '#ffe6b8', '#f8e0ae'],
    sun: 'rgba(255, 176, 32, 0.85)',
    ridges: ['#ebc893', '#ddb276', '#c99a58'],
    amp: 0.7,
    grass: ['#d2ad66', '#c19a52'],
    dirt: ['#ddb97e', '#ad8752'],
    stone: '#dfba72',
    stoneDark: '#a38040',
    deco: 'dust',
  },
  steam: {
    sky: ['#bdb6aa', '#d2cabb', '#d8cfbf'],
    sun: 'rgba(255, 196, 140, 0.55)',
    ridges: ['#a29c92', '#868076', '#66625a'],
    amp: 1,
    grass: ['#71755a', '#5f624b'],
    dirt: ['#867a6a', '#574e44'],
    stone: '#8a929e',
    stoneDark: '#4e5664',
    deco: 'smoke',
  },
  dwarf: {
    sky: ['#d9c7b1', '#e9ddcc', '#e2d5c0'],
    sun: 'rgba(255, 179, 92, 0.8)',
    ridges: ['#b0a294', '#928476', '#706458'],
    amp: 1.7,
    grass: ['#7f7f56', '#6d6d48'],
    dirt: ['#946f4c', '#634a33'],
    stone: '#9a948d',
    stoneDark: '#5e5852',
    deco: 'none',
  },
  tide: {
    sky: ['#bbe6ee', '#ddf4f2', '#d6efe9'],
    sun: 'rgba(255, 242, 196, 0.85)',
    ridges: ['#97cfd0', '#68b7b8', '#469690'],
    amp: 0.6,
    grass: ['#dccb9c', '#ccb884'],
    dirt: ['#c6ae7c', '#937d54'],
    stone: '#2fa596',
    stoneDark: '#1d6b62',
    deco: 'bubbles',
  },
  dragon: {
    sky: ['#e89a68', '#f2c296', '#f0cfae'],
    sun: 'rgba(255, 90, 20, 0.85)',
    ridges: ['#c0806a', '#9a5a46', '#744c3c'],
    amp: 1.6,
    grass: ['#6e4a32', '#5c3d29'],
    dirt: ['#8a5c46', '#5a3a2c'],
    stone: '#4a3634',
    stoneDark: '#251a1a',
    deco: 'embers',
  },
  frost: {
    sky: ['#cbe1f4', '#e7f1fa', '#eef5fb'],
    sun: 'rgba(255, 255, 255, 0.85)',
    ridges: ['#d2e3f0', '#b2cbe0', '#93b2cb'],
    amp: 1.3,
    grass: ['#eef4f8', '#dbe7ef'],
    dirt: ['#bccbd6', '#8e9eab'],
    stone: '#d4e8f8',
    stoneDark: '#8aa8c2',
    deco: 'snow',
  },
};
