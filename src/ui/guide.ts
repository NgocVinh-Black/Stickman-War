import { FACTIONS, FACTION_ORDER, FACTION_COUNTER_MULT, counteredBy, type FactionId } from '../core/factions';
import { DAMAGE_TABLE, UNITS, kindOf, roster, type ArmorType, type DamageType, type UnitStats } from '../core/units';

/** Nội dung Cẩm nang: chỉ dữ liệu tĩnh của game, không có nội dung người dùng nhập. */
export type GuidePage = 'basics' | 'factions' | 'counters' | 'tactics';
export const GUIDE_PAGES: { id: GuidePage; label: string }[] = [
  { id: 'basics', label: '📖 Cách chơi' },
  { id: 'factions', label: '🏳️ Tộc & quân' },
  { id: 'counters', label: '⚖️ Khắc chế' },
  { id: 'tactics', label: '🧠 Chiến thuật' },
];

export function basicsHtml(): string {
  return `<ul class="howto">
    <li><b>Mục tiêu</b>: phá <b>tượng</b> của địch ở cuối bản đồ, giữ tượng của mình.</li>
    <li><b>Thợ mỏ</b> đào vàng ở mỏ gần nhà. Càng nhiều thợ mỏ càng nhiều vàng, nhưng thợ mỏ không đánh được.</li>
    <li><b>Xây quân</b> ở thanh dưới cùng, phím <kbd>1</kbd>–<kbd>9</kbd> <kbd>0</kbd> <kbd>-</kbd> <kbd>=</kbd>. Giữ chuột lên nút để xem quân đó mạnh với ai, sợ ai.</li>
    <li><b>Ra lệnh cả đội</b>: 🏰 Rút về (<kbd>Q</kbd>, vào tượng hồi máu) · 🛡️ Phòng thủ (<kbd>W</kbd>) · ⚔️ Tấn công (<kbd>E</kbd>).</li>
    <li><b>Đội hình</b> (<kbd>F</kbd>): 🌀 Tự do · 🧱 Hàng lối · ↔️ Tản rộng. Xem mục Chiến thuật.</li>
    <li>💰 <b>Mỏ giữa</b> (<kbd>R</kbd>): một nửa thợ mỏ sang mỏ giàu giữa bản đồ (100 vàng/chuyến thay vì 25). Thợ mỏ chết rơi túi vàng, quân phe nào chạm trước thì nhặt.</li>
    <li>★ <b>Kỳ cựu</b>: quân hạ đủ địch thì lên sao, mỗi sao +15% máu và sát thương.</li>
    <li>🔨 <b>Thợ xây</b> dựng tối đa 3 tháp canh trước nhà. 🥁 <b>Cờ hiệu</b> làm quân quanh đó đánh mạnh và nhanh hơn.</li>
    <li>Kéo màn hình, lăn chuột, phím <kbd>A</kbd>/<kbd>D</kbd> hoặc chạm bản đồ nhỏ để nhìn quanh. <kbd>Space</kbd> tạm dừng (chơi đơn).</li>
    <li><b>Online</b>: tìm trận nhanh hoặc tạo phòng gửi mã cho bạn. <b>Đấu trường</b>: xem trận người khác và bắt kèo bằng xu ảo 🪙.</li>
  </ul>`;
}

const ARMOR_LABEL: Record<ArmorType, string> = { light: 'Nhẹ', heavy: 'Nặng', mounted: 'Kỵ', giant: 'Khổng lồ' };
const DMG_LABEL: Record<DamageType, string> = {
  slash: 'Chém', pierce: 'Đâm', arrow: 'Tên', magic: 'Phép', blunt: 'Đập', siege: 'Công thành', none: '—',
};

/** Những dòng mô tả kỹ năng đặc biệt của quân. */
function traits(s: UnitStats): string[] {
  const t: string[] = [];
  if (s.blink) t.push('lướt tới');
  if (s.stealth) t.push('tàng hình');
  if (s.charge) t.push('phi đâm ×2.5');
  if (s.chargeSplash) t.push('nghiền lan');
  if (s.kamikaze) t.push('tự nổ');
  if (s.siegeOnly) t.push('chỉ đánh tượng');
  if (s.minRange) t.push(`không bắn gần ${s.minRange}`);
  if (s.heal) t.push(`hồi ${s.heal}${s.healAoe ? ' cả nhóm' : ''}`);
  if (s.raise) t.push('gọi xác dậy');
  if (s.aura) t.push(`hào quang +${Math.round(s.aura.dmg * 100)}% đánh, +${Math.round(s.aura.haste * 100)}% tốc`);
  if (s.lifesteal) t.push(`hút máu ${Math.round(s.lifesteal * 100)}%`);
  if (s.slow) t.push('làm chậm');
  if (s.poison) t.push(`độc ${s.poison.dps}/giây`);
  if (s.regen) t.push(`hồi ${s.regen} máu/giây`);
  if (s.knock) t.push('hất lùi');
  if (s.spawnCount) t.push(`ra ${s.spawnCount} con`);
  if (s.splash && !s.kamikaze) t.push('đánh lan');
  if (s.build) t.push('dựng tháp');
  return t;
}

export function factionGuideHtml(f: FactionId): string {
  const fd = FACTIONS[f];
  const rows = [...roster(f), kindOf(f, 'tower')]
    .map((k) => {
      const s = UNITS[k];
      return `<tr>
        <td><canvas data-gicon="${k}"></canvas></td>
        <td><b>${s.name}</b><small>${s.desc}</small></td>
        <td>${s.cost || '—'}</td>
        <td>${Math.round(s.hp)}</td>
        <td>${s.damage ? Math.round(s.damage) : s.heal ? `+${s.heal}` : '—'}</td>
        <td>${s.projectile || s.heal ? Math.round(s.range) : 'gần'}</td>
        <td>${DMG_LABEL[s.dmgType]} / ${ARMOR_LABEL[s.armorType]}</td>
        <td class="traits">${traits(s).join(' · ')}</td>
      </tr>`;
    })
    .join('');
  return `
    <div class="guide-faction-pills">
      ${FACTION_ORDER.map((id) => `<button class="pill ${id === f ? 'active' : ''}" data-gfaction="${id}" style="--faction:${FACTIONS[id].color}">${FACTIONS[id].icon} ${FACTIONS[id].name}</button>`).join('')}
    </div>
    <div class="guide-faction-head" style="--faction:${fd.color}">
      <span class="faction-icon">${fd.icon}</span>
      <div><h3>${fd.name}</h3><p>${fd.desc}</p><p class="faction-passive">✨ ${fd.passive}</p>
      <p><span class="good">Khắc (+${Math.round((FACTION_COUNTER_MULT - 1) * 100)}%): ${fd.counters.map((x) => `${FACTIONS[x].icon} ${FACTIONS[x].name}`).join(', ')}</span>
       · <span class="bad">Sợ: ${counteredBy(f).map((x) => `${FACTIONS[x].icon} ${FACTIONS[x].name}`).join(', ')}</span></p></div>
    </div>
    <div class="table-wrap"><table class="unit-table">
      <thead><tr><th></th><th>Quân</th><th>Vàng</th><th>Máu</th><th>Đánh</th><th>Tầm</th><th>Đòn / Giáp</th><th>Đặc biệt</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

export function countersHtml(): string {
  const armors = Object.keys(ARMOR_LABEL) as ArmorType[];
  const dmgs = (Object.keys(DMG_LABEL) as DamageType[]).filter((d) => d !== 'none');
  const cell = (v: number) => `<td class="${v >= 1.2 ? 'good' : v <= 0.8 ? 'bad' : ''}">×${v}</td>`;
  const factionRows = FACTION_ORDER.map((f) => {
    const fd = FACTIONS[f];
    return `<tr><td>${fd.icon} ${fd.name}</td>
      <td class="good">${fd.counters.map((x) => `${FACTIONS[x].icon} ${FACTIONS[x].name}`).join(', ')}</td>
      <td class="bad">${counteredBy(f).map((x) => `${FACTIONS[x].icon} ${FACTIONS[x].name}`).join(', ')}</td></tr>`;
  }).join('');
  return `
    <h3>Kiểu đòn đánh vào kiểu giáp</h3>
    <p class="muted">Mỗi quân có một kiểu đòn và một kiểu giáp. Xanh: gây thêm sát thương. Đỏ: bị giảm.</p>
    <div class="table-wrap"><table class="counter-table">
      <thead><tr><th>Đòn \\ Giáp</th>${armors.map((a) => `<th>${ARMOR_LABEL[a]}</th>`).join('')}<th>Tượng</th></tr></thead>
      <tbody>${dmgs
        .map((d) => `<tr><td><b>${DMG_LABEL[d]}</b></td>${armors.map((a) => cell(DAMAGE_TABLE[d][a] ?? 1)).join('')}${cell(d === 'siege' ? 3 : 1)}</tr>`)
        .join('')}</tbody>
    </table></div>
    <h3>Tộc khắc tộc</h3>
    <p class="muted">Quân của tộc khắc gây thêm ${Math.round((FACTION_COUNTER_MULT - 1) * 100)}% sát thương lên mọi quân của tộc bị khắc.</p>
    <div class="table-wrap"><table class="counter-table">
      <thead><tr><th>Tộc</th><th>Khắc</th><th>Sợ</th></tr></thead><tbody>${factionRows}</tbody>
    </table></div>`;
}

export function tacticsHtml(): string {
  return `<ul class="howto">
    <li>🧱 <b>Hàng lối</b>: cả đội đi cùng tốc độ quân chậm nhất, tới nơi cùng lúc. Khiên và khổng lồ đi đầu, cận chiến sau, bắn xa sau nữa, hỗ trợ và công thành ở cuối. Hợp khi có nhiều cung thủ, pháp sư cần được che.</li>
    <li>↔️ <b>Tản rộng</b>: như hàng lối nhưng giãn cách xa. Dùng khi địch có nhiều pháp sư, khổng lồ, máy bắn đá đánh lan.</li>
    <li>🌀 <b>Tự do</b>: quân nhanh lao trước. Hợp với kỵ binh, ninja đánh úp hàng sau địch.</li>
    <li><b>Đánh sớm</b>: kỵ binh + kiếm sĩ trước phút thứ 2, ăn thua với người làm giàu.</li>
    <li><b>Làm giàu</b>: nhiều thợ mỏ + mỏ giữa + tháp canh giữ nhà, rồi ra quân đắt tiền.</li>
    <li><b>Quấy rối</b>: ninja / kỵ binh săn thợ mỏ, nhặt túi vàng rơi.</li>
    <li><b>Công thành</b>: máy bắn đá / đại bác / xe phá thành phá tượng ×3, nhưng cần giáo binh che chắn.</li>
    <li>Nhìn tộc của địch trước trận: chọn quân có kiểu đòn khắc kiểu giáp của chúng (xem mục Khắc chế).</li>
    <li>Quân lên ★★★ rất mạnh: rút về tượng hồi máu khi trận bất lợi thay vì để mất.</li>
  </ul>`;
}
