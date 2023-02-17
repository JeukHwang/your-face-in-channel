import { Injectable, Logger } from '@nestjs/common'
import { emojiAxios } from '../module/axios'
import { Buffer } from 'buffer'
import * as FormData from 'form-data'
import { InjectRepository } from '@nestjs/typeorm'
import { Emoji } from './entities/Emoji'
import { Repository } from 'typeorm'
import { GeneratedEmoji, GetEmoji } from './emoji.type'
import { Blob } from 'buffer'
@Injectable()
export class EmojiService {
  constructor(
    @InjectRepository(Emoji)
    private readonly emojiRepository: Repository<Emoji>
  ) {}
  private logger = new Logger(EmojiService.name)

  async generateEmoji(imageFile: Express.Multer.File, emoji_name: string) {
    const formData = new FormData()

    formData.append(
      'file',
      Buffer.from(imageFile.buffer),
      imageFile.originalname
    )
    try {
      const response = await emojiAxios.post('/generate', formData)
      this.logger.verbose(response.data)
      const { cover, inside }: GeneratedEmoji = response.data
      // await this.storeEmojiUrl(cover, inside, emoji_name)
      return 'good'
    } catch (e) {
      this.logger.error(e)
    }
  }

  async getAllEmoji() {
    try {
      const emojis = await this.emojiRepository.find()
      if (!emojis) {
        return null
      }
      return emojis
    } catch (e) {
      this.logger.error(e)
    }
  }

  async getEmoji(emoji_name: string): Promise<GetEmoji | null> {
    try {
      const emoji = await this.emojiRepository.findOne({
        where: {
          emoji_name: emoji_name,
        },
      })

      // 이미지를 못 찾았을 때
      if (!emoji) {
        return null
      }

      return {
        cover: emoji.cover,
        inside: emoji.inside,
      }
    } catch (e) {
      this.logger.error(e)
    }
  }

  async storeEmojiUrl(cover: string, inside: string, emoji_name: string) {
    const newEmoji = this.emojiRepository.create({
      cover: cover,
      inside: inside,
      emoji_name: emoji_name,
    })
    const createdEmoji = await this.emojiRepository.save(newEmoji)
    this.logger.verbose(`created ${createdEmoji}`)
  }
}
