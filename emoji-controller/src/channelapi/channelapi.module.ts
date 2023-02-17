import { Module } from '@nestjs/common'
import { ChannelapiService } from './channelapi.service'

@Module({
  providers: [ChannelapiService],
  exports: [ChannelapiService],
})
export class ChannelapiModule {}
