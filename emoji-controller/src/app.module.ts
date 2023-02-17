import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MockModule } from './mock/mock.module'
import { ChannelapiModule } from './channelapi/channelapi.module'
import { EmojiModule } from './emoji/emoji.module'

@Module({
  imports: [TypeORMMo, MockModule, ChannelapiModule, EmojiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
