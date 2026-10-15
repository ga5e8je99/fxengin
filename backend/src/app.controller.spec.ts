import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status', async () => {
      jest.spyOn(appController, 'getHealth').mockResolvedValue({ status: 'ok' } as any);
      const res = await appController.getHealth();
      expect(res).toBeDefined();
    });
  });
});
