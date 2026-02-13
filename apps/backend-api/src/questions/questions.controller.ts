import { Controller, Get, Post, Body } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    @Get()
    findAll() {
        return this.questionsService.findAll();
    }

    @Post()
    create(@Body() createQuestionDto: any) {
        return this.questionsService.create(createQuestionDto);
    }
}
