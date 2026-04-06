import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SupabaseService } from '../supabase/supabase.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QuestionsService {
    private readonly PARSER_URL = 'http://localhost:8000/parse-document';

    constructor(
        private supabaseService: SupabaseService,
        private httpService: HttpService,
    ) { }

    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .select('id, question_text, subject, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async remove(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .delete()
            .eq('id', id)
            .select();
        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return data[0];
    }

    async create(question: any) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .insert(question)
            .select();
        if (error) throw error;
        return data[0];
    }

    async bulkCreate(questions: any[], filename: string): Promise<{ questions: any[]; bankId: string | null }> {
        if (!questions || questions.length === 0) return { questions: [], bankId: null };

        // 1. Create a Question Bank using actual live DB columns
        const { data: bankData, error: bankError } = await this.supabaseService
            .getClient()
            .from('question_banks')
            .insert([{
                file_name: filename,
                subject: 'General',
                file_type: filename.split('.').pop()?.toUpperCase() ?? 'UNKNOWN',
                file_url: '#', // Required by live DB schema
            }])
            .select();
        
        if (bankError) throw new HttpException(bankError.message, HttpStatus.BAD_GATEWAY);
        const bankId = bankData[0].id;

        // 2. Map questions using actual live DB columns: question_text, subject
        const rows = questions.map((q) => ({
            question_text: q.text,
            subject: q.topic ?? q.subject ?? 'General',
        }));

        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .insert(rows)
            .select();

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return { questions: data, bankId };
    }

    async uploadAndParse(file: Express.Multer.File) {
        // Use Node 18+ native FormData + Blob
        const form = new FormData();
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
        form.append('file', blob, file.originalname);

        let parserResponse: any;
        try {
            const response = await firstValueFrom(
                this.httpService.post(this.PARSER_URL, form),
            );
            parserResponse = response.data;
        } catch (err: any) {
            const detail = err?.response?.data?.detail ?? err.message;
            throw new HttpException(`Parser service error: ${detail}`, HttpStatus.BAD_GATEWAY);
        }

        const questions: any[] = parserResponse.questions ?? [];
        if (questions.length === 0) {
            return { message: 'No questions found in the file.', total: 0, questions: [] };
        }

        const { questions: saved, bankId } = await this.bulkCreate(questions, file.originalname);
        return {
            message: 'Questions extracted and saved successfully.',
            total: saved.length,
            questions: saved,
            bankId
        };
    }

    async getBanks() {
        const { data: banks, error: bankError } = await this.supabaseService
            .getClient()
            .from('question_banks')
            .select('id, file_name, subject, file_type, uploaded_at')
            .order('uploaded_at', { ascending: false });
            
        if (bankError) throw new HttpException(bankError.message, HttpStatus.BAD_GATEWAY);
        
        return (banks ?? []).map((bank: any) => ({
            id: bank.id,
            name: bank.file_name,
            subject: bank.subject,
            file_type: bank.file_type,
            created_at: bank.uploaded_at,
            questions_count: 0,
        }));
    }

    async removeBank(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('question_banks')
            .delete()
            .eq('id', id)
            .select();
        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return data[0];
    }
}
