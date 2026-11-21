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
  // Hệ Quang: bình minh vàng sau dãy núi tím, đền trắng thắp đèn
  tribe: {
    sky: ['#0d0b1f', '#3a2f5c', '#f0c36a'],
    moon: '#fff7dc',
    haze: '#ffe08a',
    ridges: ['#4a3f6b', '#2c2545', '#141022'],
    amp: 1,
    ground: ['#1d1830', '#08060f'],
    crack: '#ffe08a',
    window: '#fff1b8',
    stone: '#6b6476',
    stoneDark: '#34303d',
    deco: 'embers',
  },
  // Hệ Phong: thung lũng gió ngọc bích, bụi cuốn
  orc: {
    sky: ['#06141a', '#1d4a4f', '#8fd6c2'],
    moon: '#effff9',
    haze: '#c6fff0',
    ridges: ['#24504e', '#163533', '#0a1b1a'],
    amp: 1.2,
    ground: ['#10201e', '#050b0a'],
    crack: '#c6fff0',
    window: '#e0fff6',
    stone: '#3f5a55',
    stoneDark: '#1f2e2b',
    deco: 'dust',
  },
  // Hệ Mộc: rừng già đêm, lá bay
  elf: {
    sky: ['#03121a', '#0f3a2a', '#45ad6a'],
    moon: '#e8ffe2',
    haze: '#7dff6a',
    ridges: ['#184530', '#0e2c1e', '#06160e'],
    amp: 1.1,
    ground: ['#0c1b10', '#040a05'],
    crack: '#7dff6a',
    window: '#c8ffb8',
    stone: '#30503a',
    stoneDark: '#16261b',
    deco: 'leaves',
  },
  // Hệ Ám: vực bóng đêm tím, khói đen trôi
  undead: {
    sky: ['#0a0517', '#2e1652', '#8f62cc'],
    moon: '#f1e8ff',
    haze: '#c29bff',
    ridges: ['#3b2662', '#25163f', '#120a20'],
    amp: 1,
    ground: ['#170f23', '#07040c'],
    crack: '#b388ff',
    window: '#c9a8ff',
    stone: '#3a3346',
    stoneDark: '#1d1a24',
    deco: 'smoke',
  },
  // Hệ Lôi: đồi bão tím, chớp vàng
  samurai: {
    sky: ['#08071a', '#26245a', '#7b7ad8'],
    moon: '#fffbe0',
    haze: '#fff36b',
    ridges: ['#2f2d5e', '#1d1b3d', '#0d0c1f'],
    amp: 1.3,
    ground: ['#15142a', '#06050d'],
    crack: '#fff36b',
    window: '#fff36b',
    stone: '#4a4866',
    stoneDark: '#24233a',
    deco: 'none',
  },
  // Hệ Huyết: đêm trăng máu, núi đỏ thẫm
  viking: {
    sky: ['#12030a', '#4a0a1a', '#c4283a'],
    moon: '#ffb3b3',
    haze: '#ff5a6a',
    ridges: ['#4a1220', '#2e0a14', '#16040a'],
    amp: 1.3,
    ground: ['#1f080d', '#090204'],
    crack: '#ff2d3c',
    window: '#ff6a5a',
    stone: '#4a2a30',
    stoneDark: '#24141a',
    deco: 'dust',
  },
  // Hệ Tinh thể: thung lũng pha lê hồng tím
  desert: {
    sky: ['#0f0618', '#3b1450', '#c86fd8'],
    moon: '#ffe8ff',
    haze: '#ff8af0',
    ridges: ['#4a1f5c', '#2e133b', '#16091d'],
    amp: 1.1,
    ground: ['#1c0f24', '#08040c'],
    crack: '#ff8af0',
    window: '#ffc2f5',
    stone: '#5a4566',
    stoneDark: '#2d2233',
    deco: 'dust',
  },
  // Hệ Thạch: hẻm núi đá hổ phách, bụi đá
  steam: {
    sky: ['#0e0c0a', '#3a2e22', '#b8874e'],
    moon: '#ffe6c2',
    haze: '#e8b46a',
    ridges: ['#4a3a2a', '#2e241a', '#16110c'],
    amp: 1.5,
    ground: ['#1d1712', '#080605'],
    crack: '#e8b46a',
    window: '#ffc070',
    stone: '#5a5048',
    stoneDark: '#2d2824',
    deco: 'dust',
  },
  // Hệ Kim: núi sắt lò rèn, tàn lửa
  dwarf: {
    sky: ['#0c0b10', '#2e2a33', '#a8734a'],
    moon: '#ffe2c4',
    haze: '#ff9a5a',
    ridges: ['#3b3842', '#25222b', '#121116'],
    amp: 1.7,
    ground: ['#18161b', '#08070a'],
    crack: '#ff8c3a',
    window: '#ffb060',
    stone: '#4b4a52',
    stoneDark: '#25242a',
    deco: 'embers',
  },
  // Hệ Thủy: biển đêm xanh thẳm, bong bóng
  tide: {
    sky: ['#020a1c', '#0a2f5e', '#3a8fd8'],
    moon: '#e6f6ff',
    haze: '#4fd2ff',
    ridges: ['#123a66', '#0a2444', '#041226'],
    amp: 0.6,
    ground: ['#0a1626', '#03080f'],
    crack: '#4fd2ff',
    window: '#a8e8ff',
    stone: '#1f3b5b',
    stoneDark: '#0e1d2e',
    deco: 'bubbles',
  },
  // Hệ Hỏa: núi lửa, dung nham
  dragon: {
    sky: ['#14040a', '#4c0e14', '#ff6326'],
    moon: '#ffd4a6',
    haze: '#ff7a3a',
    ridges: ['#4c1511', '#2f0a0a', '#170505'],
    amp: 1.6,
    ground: ['#210b08', '#0a0303'],
    crack: '#ff7a1a',
    window: '#ff8a3a',
    stone: '#3b2523',
    stoneDark: '#1d1010',
    deco: 'embers',
  },
  // Hệ Băng: xứ tuyết, tuyết rơi
  frost: {
    sky: ['#060c20', '#1d3262', '#90bef2'],
    moon: '#ffffff',
    haze: '#b4dcff',
    ridges: ['#3b5282', '#23365b', '#101a30'],
    amp: 1.3,
    ground: ['#1b2539', '#080c16'],
    crack: '#e3f6ff',
    window: '#d8f0ff',
    stone: '#4b5b74',
    stoneDark: '#252d3b',
    deco: 'snow',
  },
};
