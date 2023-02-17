import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { EmojiService } from './emoji.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { emojiAxios } from '../module/axios'

@Controller('emoji')
export class EmojiController {
  constructor(private readonly emojiService: EmojiService) {}

  private readonly logger = new Logger(EmojiController.name)

  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  async generateEmoji(
    @UploadedFile() file: Express.Multer.File,
    @Body('emoji-name') emojiName
  ) {
    console.log(emojiName)
    return await this.emojiService.generateEmoji(file, emojiName)
  }

  @Post('/notification')
  async notifyEmoji(@Body() requestBody) {
    this.logger.verbose(requestBody)
  }

  @Get('')
  async getAllEmoji() {
    return this.emojiService.getAllEmoji()
  }

  @Get(':emoji_name')
  async getEmoji(@Param('emoji_name') emojiName: string) {
    return this.emojiService.getEmoji(emojiName)
  }
}
