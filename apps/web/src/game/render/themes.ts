import type { FactionId } from '@stickman-war/core';

/** Kiểu hạt bay trang trí nền (vẽ không cần lưu trạng thái, tính theo thời gian). */
export type Deco = 'none' | 'snow' | 'embers' | 'leaves' | 'petals' | 'bubbles' | 'dust' | 'smoke';

/**
 * Chiến trường đêm của từng nền văn minh, theo phong cách ảnh nền màn đăng nhập: trời đêm sẫm sáng dần về chân
 * trời, trăng lớn có quầng, ba dãy núi đá bóng đen (xa → gần) viền sáng, lâu đài xa có cửa sổ thắp đèn, mặt đất
 * đá tối với vết nứt toả sáng. Nửa bản đồ nhà mỗi bên vẽ theo nền văn minh bên đó.
 * Chân trời và quầng trăng đủ sáng để bóng stickman (thân đen, viền sáng màu phe) nổi rõ.
 */
export type Theme = {
  /** Đỉnh trời → giữa → chân trời (sáng nhất). */
  sky: [string, string, string];
  /** Màu đĩa trăng. */
  moon: string;
  /** Quầng sáng quanh trăng, sương chân trời, viền sáng mép núi. */
  haze: string;
  /** Núi xa → gần (tối dần). */
  ridges: [string, string, string];
  /** Biên độ núi (núi đá cao, đồi cát thấp…). */
  amp: number;
  /** Mặt đất: sát chân quân → đáy màn hình. */
  ground: [string, string];
  /** Vết nứt phát sáng dưới đất, tàn lửa bay. */
  crack: string;
  /** Ánh đèn cửa sổ lâu đài xa. */
  window: string;
  /** Màu đá công trình nhà (tượng). */
  stone: string;
  stoneDark: string;
  deco: Deco;
};

export const THEMES: Record<FactionId, Theme> = {
  tribe: {
    sky: ['#0b0a22', '#2a2466', '#8577d8'],
    moon: '#ece8ff',
    haze: '#a99cff',
    ridges: ['#3b3374', '#251f4e', '#130f28'],
    amp: 1,
    ground: ['#1b1631', '#07060e'],
    crack: '#5aa9ff',
    window: '#ffd27a',
    stone: '#4b4a6c',
    stoneDark: '#25233c',
    deco: 'embers',
  },
  orc: {
    sky: ['#15060a', '#4a1418', '#c4553c'],
    moon: '#ffd6b8',
    haze: '#ff8a5a',
    ridges: ['#4e1d1c', '#2f1012', '#170809'],
    amp: 1.2,
    ground: ['#200f0c', '#090404'],
    crack: '#ff5a1f',
    window: '#ff9a3c',
    stone: '#4c3b33',
    stoneDark: '#251a16',
    deco: 'dust',
  },
  elf: {
    sky: ['#03121a', '#0f3a3c', '#45ad90'],
    moon: '#e2fff3',
    haze: '#7dffc8',
    ridges: ['#184539', '#0e2c25', '#061612'],
    amp: 1.1,
    ground: ['#0c1b14', '#040a07'],
    crack: '#3dffa0',
    window: '#b8ffda',
    stone: '#30503e',
    stoneDark: '#16261d',
    deco: 'leaves',
  },
  undead: {
    sky: ['#0a0517', '#2e1652', '#8f62cc'],
    moon: '#f1e8ff',
    haze: '#c29bff',
    ridges: ['#3b2662', '#25163f', '#120a20'],
    amp: 1,
    ground: ['#170f23', '#07040c'],
    crack: '#b388ff',
    window: '#c9a8ff',
    stone: '#4b455a',
    stoneDark: '#24202f',
    deco: 'dust',
  },
  samurai: {
    sky: ['#12061a', '#3e1239', '#d4566e'],
    moon: '#ffe4e8',
    haze: '#ff8aa0',
    ridges: ['#4b1e41', '#2f1029', '#170814'],
    amp: 1.3,
    ground: ['#1d0d17', '#080308'],
    crack: '#ff4d5e',
    window: '#ffb070',
    stone: '#4c2f38',
    stoneDark: '#25161b',
    deco: 'petals',
  },
  viking: {
    sky: ['#040c1c', '#13405e', '#55b0cc'],
    moon: '#e8f7ff',
    haze: '#8ee6ff',
    ridges: ['#1f3c55', '#132739', '#08121c'],
    amp: 1.4,
    ground: ['#0f1721', '#04080c'],
    crack: '#5fd4ff',
    window: '#ffd27a',
    stone: '#3b4655',
    stoneDark: '#1c232b',
    deco: 'none',
  },
  desert: {
    sky: ['#120a1f', '#4b2541', '#e3964e'],
    moon: '#fff2cc',
    haze: '#ffc36a',
    ridges: ['#5b3541', '#3b2131', '#1c1018'],
    amp: 0.7,
    ground: ['#23171b', '#0a0608'],
    crack: '#ffd24a',
    window: '#ffd24a',
    stone: '#5b4b3b',
    stoneDark: '#2d251d',
    deco: 'dust',
  },
  steam: {
    sky: ['#0e0c11', '#34292b', '#a6653d'],
    moon: '#ffdab4',
    haze: '#ffaa66',
    ridges: ['#3b3135', '#251f23', '#121012'],
    amp: 1,
    ground: ['#1a1614', '#080706'],
    crack: '#ffa94d',
    window: '#ffa94d',
    stone: '#3f3f48',
    stoneDark: '#1f1f25',
    deco: 'smoke',
  },
  dwarf: {
    sky: ['#100a10', '#3b2323', '#c46e3c'],
    moon: '#ffe2c4',
    haze: '#ff9a5a',
    ridges: ['#4b3131', '#2f1f1f', '#160e0e'],
    amp: 1.7,
    ground: ['#1f1510', '#0a0605'],
    crack: '#ff8c3a',
    window: '#ffb060',
    stone: '#4b4541',
    stoneDark: '#25211f',
    deco: 'embers',
  },
  tide: {
    sky: ['#020e1a', '#0a3b52', '#2fb6b4'],
    moon: '#e2fffb',
    haze: '#6ff5e4',
    ridges: ['#134152', '#0a2937', '#04141c'],
    amp: 0.6,
    ground: ['#0a1b1f', '#03090b'],
    crack: '#2ef2d0',
    window: '#9ffff0',
    stone: '#1f4b4b',
    stoneDark: '#0e2525',
    deco: 'bubbles',
  },
  dragon: {
    sky: ['#14040a', '#4c0e14', '#ff6326'],
    moon: '#ffd4a6',
    haze: '#ff7a3a',
    ridges: ['#4c1511', '#2f0a0a', '#170505'],
    amp: 1.6,
    ground: ['#210b08', '#0a0303'],
    crack: '#ff5a1f',
    window: '#ff8a3a',
    stone: '#3b2523',
    stoneDark: '#1d1010',
    deco: 'embers',
  },
  frost: {
    sky: ['#060c20', '#1d3262', '#90bef2'],
    moon: '#ffffff',
    haze: '#b4dcff',
    ridges: ['#3b5282', '#23365b', '#101a30'],
    amp: 1.3,
    ground: ['#1b2539', '#080c16'],
    crack: '#9fdcff',
    window: '#d8f0ff',
    stone: '#4b5b74',
    stoneDark: '#252d3b',
    deco: 'snow',
  },
};
