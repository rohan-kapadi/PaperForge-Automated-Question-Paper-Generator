import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
    imports: [
        HttpModule,
        MulterModule.register({ storage: memoryStorage() }),
    ],
    controllers: [QuestionsController],
    providers: [QuestionsService],
})
export class QuestionsModule { }
