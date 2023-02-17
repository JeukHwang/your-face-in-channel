import axios from 'axios'

export const channelAxios = axios.create({
  baseURL: 'https://api.channel.io',
})

channelAxios.defaults.headers['x-access-key'] = '63ee30efe3d4d006c89e'
channelAxios.defaults.headers['x-access-secret'] =
  'f02face86164f0a6e1dc398b39032011'

export const emojiAxios = axios.create({
  baseURL: 'https://c681-115-94-114-198.jp.ngrok.io',
})
