import {
    Controller, Get, Post, Patch, Body, Param, Delete, Query,
    UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuestionsService } from './questions.service';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv'];

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    // GET /questions?bankId=<uuid>
    @Get()
    findAll(@Query('bankId') bankId?: string) {
        return this.questionsService.findAll(bankId);
    }

    // GET /questions/banks
    @Get('banks')
    getBanks() {
        return this.questionsService.getBanks();
    }

    // GET /questions/banks/:id/questions
    @Get('banks/:id/questions')
    findByBank(@Param('id') bankId: string) {
        return this.questionsService.findAll(bankId);
    }

    // GET /questions/:id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.questionsService.findOne(id);
    }

    // POST /questions
    @Post()
    create(@Body() createQuestionDto: any) {
        return this.questionsService.create(createQuestionDto);
    }

    // POST /questions/upload — parse file and save to DB
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded.');

        const name = (file.originalname || '').toLowerCase();
        const hasValidExt = ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext));
        if (!hasValidExt) {
            throw new BadRequestException(
                `Unsupported file format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
            );
        }

        return this.questionsService.uploadAndParse(file);
    }

    // POST /questions/analyze-missing?bankId=<uuid>
    // Reclassifies questions that are missing AI metadata
    @Post('analyze-missing')
    analyzeMissing(@Query('bankId') bankId?: string) {
        return this.questionsService.analyzeMissing(bankId);
    }

    // PATCH /questions/:id — teacher metadata override
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.questionsService.update(id, updateDto);
    }

    // DELETE /questions/:id
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.questionsService.remove(id);
    }

    // DELETE /questions/banks/:id
    @Delete('banks/:id')
    removeBank(@Param('id') id: string) {
        return this.questionsService.removeBank(id);
    }
}
