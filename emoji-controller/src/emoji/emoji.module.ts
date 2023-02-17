import { Module } from '@nestjs/common';
import { EmojiService } from './emoji.service';
import { EmojiController } from './emoji.controller';

@Module({
  providers: [EmojiService],
  controllers: [EmojiController]
})
export class EmojiModule {}
