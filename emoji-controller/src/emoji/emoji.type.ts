export type GeneratedEmoji = {
  cover: string
  inside: string
}

export type GeneratedEmojis = {
  items: [GeneratedEmoji]
}

export type GetEmoji = {
  cover?: string
  inside?: string
}
