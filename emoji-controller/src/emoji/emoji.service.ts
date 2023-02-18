import { Injectable, Logger } from '@nestjs/common'
import { emojiAxios } from '../module/axios'
import { Buffer } from 'buffer'
import * as FormData from 'form-data'
import { InjectRepository } from '@nestjs/typeorm'
import { Emoji } from './entities/Emoji'
import { Repository } from 'typeorm'
import { GeneratedEmoji, GetEmoji } from './emoji.type'
import { ChannelapiService } from '../channelapi/channelapi.service'

@Injectable()
export class EmojiService {
  constructor(
    @InjectRepository(Emoji)
    private readonly emojiRepository: Repository<Emoji>,
    private readonly channelService: ChannelapiService
  ) {}
  private logger = new Logger(EmojiService.name)

  async generateEmoji(imageFile: Express.Multer.File, emoji_name: string) {
    const emoji = await this.emojiRepository.findOne({
      where: {
        emoji_key: emoji_name,
      },
    })
    if (emoji) {
      await this.channelService.sendMessage(
        '250728',
        `${emoji_name} 은 이미 사용 중입니다`
      )
      return null
    } else {
      const formData = new FormData()
      formData.append(
        'file',
        Buffer.from(imageFile.buffer),
        imageFile.originalname
      )
      formData.append('name', emoji_name)

      try {
        const response = await emojiAxios.post('/generate', formData)
        const { time, wait } = response.data
        await this.channelService.sendMessage(
          '250728',
          `이모지를 생성중입니다😄\n⏳대기 중인 이모지 : ${wait}개⏳\n⏱예상 소요 시간 : ${Math.round(
            time * wait
          )}초⏱`
        )
        return {
          time: time,
          wait: wait,
        }
      } catch (e) {
        this.logger.error('error', e)
      }
    }
  }

  async notifyGeneratingEmoji(body) {
    const items = body.items
    for (let i = 0; i < items.length; i++) {
      const { cover, inside, emoji_key } = items[i]
      const names = emoji_key.split('_')
      await this.storeEmojiUrl(cover, inside, emoji_key, names[1])
      await this.channelService.sendMessage(
        '250728',
        `🎉 이제 ${emoji_key} 을 사용하실 수 있어요 🎉`
      )
    }

    await this.channelService.sendMessage(
      '250728',
      `😍;{이모지이름}; 을 채팅창에 입력해보세요😍\n😎새로운 이모지를 만들고 싶으면 [{이모지이름}]을 채팅창에 입력한 후 사진을 첨부해주세요😎`
    )
  }

  async getAllEmoji() {
    try {
      const emojis = await this.emojiRepository.find()
      if (emojis.length === 0) {
        return {
          inside:
            'https://channel-emoji.s3.ap-northeast-2.amazonaws.com/channel.png',
        }
      }
      return emojis
    } catch (e) {
      this.logger.error(e)
    }
  }

  async getEmoji(emoji_name: string): Promise<GetEmoji | string> {
    try {
      if (emoji_name == 'channel-emoji') {
        return {
          inside:
            'https://channel-emoji.s3.ap-northeast-2.amazonaws.com/channel.png',
        }
      }
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

  async storeEmojiUrl(
    cover: string,
    inside: string,
    emoji_name: string,
    key: string
  ) {
    try {
      const newEmoji = this.emojiRepository.create({
        cover: cover,
        inside: inside,
        emoji_name: emoji_name,
        emoji_key: key,
      })
      await this.emojiRepository.save(newEmoji)
    } catch (e) {
      this.logger.error(e)
    }
  }
}
