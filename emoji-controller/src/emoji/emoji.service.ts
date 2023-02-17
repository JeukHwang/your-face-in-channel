import { Injectable, Logger } from '@nestjs/common'
import { emojiAxios } from '../module/axios'
import { Buffer } from 'buffer'
import * as FormData from 'form-data'

@Injectable()
export class EmojiService {
  private logger = new Logger(EmojiService.name)

  async generateEmoji(imageFile: Express.Multer.File) {
    const formData = new FormData()
    formData.append(
      'file',
      Buffer.from(imageFile.buffer),
      imageFile.originalname
    )
    try {
      const response = await emojiAxios.post('/generate', formData)
      // response.data.items
      return 'good'
    } catch (e) {
      this.logger.error(e)
    }
  }

  async storeEmojiUrl() {}
}
