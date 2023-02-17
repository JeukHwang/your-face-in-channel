import { Controller, Get } from "@nestjs/common";

@Controller('mock')
export class MockController {

  @Get('/image-path')
  getImagePath(): string {
    return "https://channel-emoji.s3.ap-northeast-2.amazonaws.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA+2023-02-17+%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE+7.28.22"
  }
}
