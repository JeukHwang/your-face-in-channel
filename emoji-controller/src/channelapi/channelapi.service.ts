import { Injectable } from '@nestjs/common'
import { channelAxios } from '../module/axios'
import { GET_LIST_OF_MESSAGE, SEND_MESSAGE } from './api-values'
import { generateFileBody } from './utils'

@Injectable()
export class ChannelapiService {
  async getListOfMessages(groupId) {
    const response = await channelAxios.get(`${GET_LIST_OF_MESSAGE(groupId)}`)
    console.log(JSON.stringify(response.data.messages))
  }

  async sendMessage(groupId: string) {
    const mockBody = {
      blocks: [
        {
          type: 'text',
          value: "hello i'm nest server",
        },
      ],
    }
    const response = await channelAxios.post(
      `${SEND_MESSAGE(groupId)}`,
      generateFileBody('hello', 'hello')
    )
    console.log(response.data.blocks)
  }
}
