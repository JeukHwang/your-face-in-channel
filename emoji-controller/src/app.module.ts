import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MockModule } from './mock/mock.module'
import { ChannelapiModule } from './channelapi/channelapi.module'
import { EmojiModule } from './emoji/emoji.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Emoji } from './emoji/entities/Emoji'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'emoji',
      entities: [Emoji],
      synchronize: true,
    }),
    MockModule,
    ChannelapiModule,
    EmojiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
