import { Module } from '@nestjs/common'
import { EmojiService } from './emoji.service'
import { EmojiController } from './emoji.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Emoji } from './entities/Emoji'
import { ChannelapiService } from '../channelapi/channelapi.service'

@Module({
  imports: [TypeOrmModule.forFeature([Emoji])],
  providers: [EmojiService, ChannelapiService],
  controllers: [EmojiController],
})
export class EmojiModule {}
