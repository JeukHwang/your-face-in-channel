import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { EmojiService } from './emoji.service'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('emoji')
export class EmojiController {
  constructor(private readonly emojiService: EmojiService) {}

  @Post('/new')
  @UseInterceptors(FileInterceptor('file'))
  async generateEmoji(
    @UploadedFile() file: Express.Multer.File,
    @Body('emoji-name') emojiName
  ) {
    return await this.emojiService.generateEmoji(file)
  }
}
