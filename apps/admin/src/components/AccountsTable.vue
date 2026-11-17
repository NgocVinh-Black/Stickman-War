<script setup lang="ts">
import type { AdminAccount } from '../api';
import { ago, faction, fmtDate, fmtNum } from '../format';
import Avatar from './Avatar.vue';

defineProps<{ accounts: AdminAccount[]; loading: boolean; selected: string | null }>();
const emit = defineEmits<{ open: [id: string] }>();
</script>

<template>
  <div class="table-wrap" :class="{ dim: loading }">
    <table class="accounts">
      <thead>
        <tr>
          <th>Người chơi</th>
          <th>Tộc</th>
          <th class="num">Elo</th>
          <th class="num">Thắng / Thua / Hoà</th>
          <th class="num">Xu</th>
          <th>Đăng ký</th>
          <th>Lần cuối vào</th>
          <th class="num">Phiên</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="a in accounts"
          :key="a.id"
          :class="{ active: a.id === selected }"
          tabindex="0"
          @click="emit('open', a.id)"
          @keydown.enter="emit('open', a.id)"
        >
          <td>
            <div class="who">
              <Avatar :name="a.name" :picture="a.picture" />
              <div>
                <div class="who-name">
                  {{ a.name }}
                  <span v-if="a.isAdmin" class="badge">Admin</span>
                </div>
                <div class="who-id">{{ a.id }}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="faction" :style="{ '--fc': faction(a.faction).color }"
              >{{ faction(a.faction).icon }} {{ faction(a.faction).name }}</span
            >
          </td>
          <td class="num strong">{{ a.rating }}</td>
          <td class="num">
            <span class="win">{{ a.wins }}</span> / <span class="lose">{{ a.losses }}</span> / {{ a.draws }}
          </td>
          <td class="num">{{ fmtNum(a.xu) }}</td>
          <td :title="fmtDate(a.createdAt)">{{ fmtDate(a.createdAt) }}</td>
          <td :title="fmtDate(a.lastSeen)">{{ ago(a.lastSeen) }}</td>
          <td class="num">{{ a.sessions }}</td>
        </tr>
        <tr v-if="!accounts.length && !loading">
          <td colspan="8" class="empty">Không có tài khoản nào khớp.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
