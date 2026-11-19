import { Controller, Get, Inject } from '@nestjs/common';
import { LobbyService } from '../game/lobby.service';

/** Kiểm tra sống (Docker HEALTHCHECK, nginx): kèm số người chơi / phòng đang mở. */
@Controller()
export class HealthController {
  constructor(@Inject(LobbyService) private readonly lobby: LobbyService) {}

  @Get('health')
  health() {
    return { ok: true, ...this.lobby.stats() };
  }
}
