import { Test, TestingModule } from '@nestjs/testing';
import { ChannelapiService } from './channelapi.service';

describe('ChannelapiService', () => {
  let service: ChannelapiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelapiService],
    }).compile();

    service = module.get<ChannelapiService>(ChannelapiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
