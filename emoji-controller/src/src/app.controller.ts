import { Controller, Get, Post } from '@nestjs/common'
import { AppService } from './app.service'
import { ChannelapiService } from './channelapi/channelapi.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly channelAPI: ChannelapiService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('/channel')
  async testChannel() {
    return await this.channelAPI.getListOfMessages('250158')
  }

  @Post('/channel')
  async sendMessageToChannelTalk() {
    return await this.channelAPI.sendMessage('250158')
  }
}
