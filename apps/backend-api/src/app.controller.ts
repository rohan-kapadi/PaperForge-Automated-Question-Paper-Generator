import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('stats')
  getStats() {
    return this.appService.getStats();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'backend-api',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
