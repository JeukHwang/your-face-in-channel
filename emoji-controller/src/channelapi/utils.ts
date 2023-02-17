export const generateFileBody = (filename: string, domain: string) => {
  return {
    files: [
      {
        id: Date.now(),
        type: 'image',
        name: `${Date.now()}.png`,
        size: 128642,
        contentType: 'image/jpeg',
        width: 1081,
        height: 1080,
        bucket: 's3.ap-northeast-2.amazonaws.com/www.beginlab.co.kr',
        key: '1655799813897.png',
      },
    ],
  }
}

export const generateTextMessage = (message: string) => {
  return {
    blocks: [
      {
        type: 'text',
        value: message,
      },
    ],
  }
}
