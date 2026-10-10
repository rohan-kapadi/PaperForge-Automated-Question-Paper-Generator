import { Controller, Get, Post, Patch, Body, Param, Query, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { PapersService, GeneratePaperDto, UpdatePaperStatusDto, ReplaceQuestionDto } from './papers.service';

@Controller('papers')
export class PapersController {
    constructor(private readonly papersService: PapersService) { }

    @Post('generate')
    generate(@Body() dto: GeneratePaperDto) {
        return this.papersService.generate(dto);
    }

    @Get()
    findAll() {
        return this.papersService.findAll();
    }

    @Get('candidates')
    getCandidates(
        @Query('bankId') bankId?: string,
        @Query('marks') marks?: string,
        @Query('excludeIds') excludeIds?: string,
    ) {
        const parsedMarks = marks ? parseInt(marks, 10) : undefined;
        const parsedExclude = excludeIds ? excludeIds.split(',') : undefined;
        return this.papersService.getCandidates(bankId, parsedMarks, parsedExclude);
    }

    @Post('export/docx')
    async exportDirectDocx(@Body() body: any, @Res() res: Response) {
        const buffer = await this.papersService.exportDocx(body);
        const filename = `${(body.subject || 'Question_Paper').replace(/\s+/g, '_')}_PCCOER.docx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
    }

    @Get(':id/export/docx')
    async exportPaperDocx(@Param('id') id: string, @Res() res: Response) {
        const paper = await this.papersService.findOne(id);
        if (!paper) {
            throw new NotFoundException(`Paper ${id} not found`);
        }
        const header = paper.content?.header || {};
        const payload = {
            subject: header.subject_name || paper.title || 'Examination Paper',
            subject_code: header.subject_code || '',
            department: header.department || 'Computer Engineering',
            class: header.student_class || 'SE',
            div: header.div || 'A, B, C, D, E, F',
            academic_year: header.academic_year || '2025 – 26',
            term: header.term || 'II',
            exam_type: header.exam_type_display || paper.exam_type || 'UNIT TEST',
            max_marks: paper.total_marks || header.max_marks || 30,
            duration: header.duration || `${header.duration_minutes || 60} Min`,
            date: header.exam_date || '',
            record_no: header.record_no || 'ACAD/R/11',
            rev: header.rev || '00',
            rev_date: header.rev_date || '01-09-2025',
            co_list: header.course_outcomes || [],
            content: paper.content,
            sections: paper.content?.sections || paper.sections || [],
        };
        const buffer = await this.papersService.exportDocx(payload);
        const filename = `${(paper.title || 'Question_Paper').replace(/\s+/g, '_')}_PCCOER.docx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
    }


    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.papersService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdatePaperStatusDto) {
        return this.papersService.updateStatus(id, dto);
    }

    @Post(':id/replace')
    replaceQuestion(@Param('id') id: string, @Body() dto: ReplaceQuestionDto) {
        return this.papersService.replaceQuestion(id, dto);
    }
}

