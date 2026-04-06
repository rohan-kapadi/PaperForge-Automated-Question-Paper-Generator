import {
    Controller, Get, Post, Body, Param, Delete,
    UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuestionsService } from './questions.service';

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
];

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    @Get()
    findAll() {
        return this.questionsService.findAll();
    }

    @Get('banks')
    getBanks() {
        return this.questionsService.getBanks();
    }

    @Post()
    create(@Body() createQuestionDto: any) {
        return this.questionsService.create(createQuestionDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.questionsService.remove(id);
    }

    @Delete('banks/:id')
    removeBank(@Param('id') id: string) {
        return this.questionsService.removeBank(id);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded.');
        }

        // Accept by extension as fallback (browser MIME types can vary)
        const name = file.originalname.toLowerCase();
        const allowedExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv'];
        const hasValidExt = allowedExtensions.some((ext) => name.endsWith(ext));

        if (!hasValidExt) {
            throw new BadRequestException(
                'Unsupported file format. Allowed: PDF, DOCX, XLSX, XLS, CSV.',
            );
        }

        return this.questionsService.uploadAndParse(file);
    }
}
