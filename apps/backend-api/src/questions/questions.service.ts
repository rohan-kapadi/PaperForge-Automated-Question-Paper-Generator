import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SupabaseService } from '../supabase/supabase.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QuestionsService {
    private readonly PARSER_URL = 'http://localhost:8000';

    constructor(
        private supabaseService: SupabaseService,
        private httpService: HttpService,
    ) { }

    // -------------------------------------------------------------------------
    // READ: All questions with full metadata
    // -------------------------------------------------------------------------
    async findAll(bankId?: string) {
        let query = this.supabaseService
            .getClient()
            .from('questions')
            .select(`
                id,
                bank_id,
                text,
                marks,
                difficulty,
                topic,
                unit,
                co,
                blooms_level,
                question_type,
                classification_source,
                metadata,
                image_url,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (bankId) {
            query = query.eq('bank_id', bankId);
        }

        const { data, error } = await query;
        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return data ?? [];
    }

    // -------------------------------------------------------------------------
    // READ: Single question
    // -------------------------------------------------------------------------
    async findOne(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        return data;
    }

    // -------------------------------------------------------------------------
    // CREATE: Single question
    // -------------------------------------------------------------------------
    async create(question: any) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .insert(question)
            .select();
        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return data[0];
    }

    // -------------------------------------------------------------------------
    // UPDATE: Metadata override (teacher or AI)
    // When source = 'teacher', marks the question as teacher-confirmed.
    // -------------------------------------------------------------------------
    async update(id: string, dto: any) {
        const source = dto.source || 'teacher';

        // Fetch current question to preserve existing AI metadata in history
        const { data: existing } = await this.supabaseService
            .getClient()
            .from('questions')
            .select('metadata, difficulty, blooms_level, topic, unit, question_type')
            .eq('id', id)
            .single();

        const currentMeta = (existing?.metadata as any) || {};
        const overrideHistory = currentMeta.override_history || [];

        // Track what changed for audit
        if (source === 'teacher' && existing) {
            const changedFields: any = {};
            if (dto.difficulty && dto.difficulty !== existing.difficulty) changedFields.difficulty = existing.difficulty;
            if (dto.blooms_level && dto.blooms_level !== existing.blooms_level) changedFields.blooms_level = existing.blooms_level;
            if (dto.topic && dto.topic !== existing.topic) changedFields.topic = existing.topic;
            if (dto.unit && dto.unit !== existing.unit) changedFields.unit = existing.unit;
            if (dto.question_type && dto.question_type !== existing.question_type) changedFields.question_type = existing.question_type;

            if (Object.keys(changedFields).length > 0) {
                overrideHistory.push({
                    timestamp: new Date().toISOString(),
                    previous_values: changedFields,
                    source: existing.metadata?.classification_source || 'ai',
                });
            }
        }

        const updatedMeta = {
            ...currentMeta,
            override_history: overrideHistory,
        };

        // Build update payload from DTO (only include provided fields)
        const updatePayload: any = {
            classification_source: source,
            metadata: updatedMeta,
        };

        const allowedFields = [
            'text', 'marks', 'difficulty', 'topic', 'unit',
            'co', 'blooms_level', 'question_type', 'image_url',
        ];
        for (const field of allowedFields) {
            if (dto[field] !== undefined && dto[field] !== null) {
                updatePayload[field] = dto[field];
            }
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .update(updatePayload)
            .eq('id', id)
            .select();

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);

        // Record in audit_logs
        try {
            await this.supabaseService.getClient().from('audit_logs').insert([{
                action: 'QUESTION_MODIFIED',
                details: {
                    message: `Teacher updated question metadata`,
                    question_id: id,
                    source,
                },
            }]);
        } catch (_) { }

        return data[0];
    }

    // -------------------------------------------------------------------------
    // DELETE: Single question
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // BULK CREATE: After file parsing — saves all metadata fields
    // -------------------------------------------------------------------------
    async bulkCreate(questions: any[], filename: string, bankName?: string): Promise<{ questions: any[]; bankId: string | null }> {
        if (!questions || questions.length === 0) return { questions: [], bankId: null };

        // 1. Create a Question Bank entry (using correct live schema columns)
        const ext = (filename.split('.').pop() || 'unknown').toUpperCase();
        const { data: bankData, error: bankError } = await this.supabaseService
            .getClient()
            .from('question_banks')
            .insert([{
                name: bankName || filename,       // 'name' is the correct column
                file_name: filename,               // original filename for display
                file_type: ext,                   // e.g. 'XLSX', 'PDF'
                subject_code: null,               // faculty fills this later
            }])
            .select();

        if (bankError) throw new HttpException(`Bank creation failed: ${bankError.message}`, HttpStatus.BAD_GATEWAY);
        const bankId: string = bankData[0].id;

        // 2. Map parser output → DB columns (all intelligence fields preserved)
        const rows = questions.map((q) => {
            const meta = q.metadata || {};
            // Ensure 'confidence' is in metadata for later retrieval
            if (q.confidence != null) meta.confidence = q.confidence;

            return {
                bank_id: bankId,
                text: q.text || '',
                marks: q.marks || 5,
                difficulty: this.normalizeDifficulty(q.difficulty),
                topic: q.topic || null,
                unit: q.unit || null,
                co: q.co || null,
                blooms_level: this.normalizeBloomsLevel(q.blooms_level),
                question_type: q.question_type || 'Short Answer',
                classification_source: q.classification_source || 'ai',
                metadata: meta,
            };
        });

        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .insert(rows)
            .select();

        if (error) throw new HttpException(`Question insert failed: ${error.message}`, HttpStatus.BAD_GATEWAY);
        return { questions: data, bankId };
    }

    // -------------------------------------------------------------------------
    // UPLOAD & PARSE: Orchestrates file → parser → DB
    // -------------------------------------------------------------------------
    async uploadAndParse(file: Express.Multer.File) {
        const form = new FormData();
        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
        form.append('file', blob, file.originalname);

        let parserResponse: any;
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.PARSER_URL}/parse-document`, form),
            );
            parserResponse = response.data;
        } catch (err: any) {
            const detail = err?.response?.data?.detail ?? err.message;
            throw new HttpException(`Parser service error: ${detail}`, HttpStatus.BAD_GATEWAY);
        }

        const questions: any[] = parserResponse.questions ?? [];
        if (questions.length === 0) {
            return { message: 'No questions found in file.', total: 0, questions: [], bankId: null };
        }

        const { questions: saved, bankId } = await this.bulkCreate(questions, file.originalname);
        return {
            message: 'Questions parsed and saved successfully.',
            total: saved.length,
            questions: saved,
            bankId,
        };
    }

    // -------------------------------------------------------------------------
    // GET BANKS: Question banks with question counts
    // -------------------------------------------------------------------------
    async getBanks() {
        const { data: banks, error } = await this.supabaseService
            .getClient()
            .from('question_banks')
            .select('id, name, file_name, file_type, subject_code, subject, uploaded_at')
            .order('uploaded_at', { ascending: false });

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);

        // Get question counts per bank
        const bankIds = (banks ?? []).map((b: any) => b.id);
        let countMap: Record<string, number> = {};

        if (bankIds.length > 0) {
            const { data: countData } = await this.supabaseService
                .getClient()
                .from('questions')
                .select('bank_id')
                .in('bank_id', bankIds);

            for (const row of countData ?? []) {
                countMap[row.bank_id] = (countMap[row.bank_id] || 0) + 1;
            }
        }

        return (banks ?? []).map((bank: any) => ({
            id: bank.id,
            name: bank.name || bank.file_name || 'Untitled Bank',
            file_name: bank.file_name,
            file_type: bank.file_type,
            subject: bank.subject_code || bank.subject,
            created_at: bank.uploaded_at,
            uploaded_at: bank.uploaded_at,
            questions_count: countMap[bank.id] || 0,
        }));
    }

    // -------------------------------------------------------------------------
    // DELETE BANK: Cascade deletes questions via FK
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // ANALYZE MISSING: Reclassify questions lacking AI metadata
    // -------------------------------------------------------------------------
    async analyzeMissing(bankId?: string) {
        // Find questions not locked by teacher override
        let query = this.supabaseService
            .getClient()
            .from('questions')
            .select('id, text, marks, classification_source, unit')
            .neq('classification_source', 'teacher');

        if (bankId) query = query.eq('bank_id', bankId);

        const { data: candidates, error } = await query.limit(200);
        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        if (!candidates || candidates.length === 0) {
            return { processed: 0, message: 'No AI-classified questions found to analyze.' };
        }

        // Batch classify via parser service
        const batch = candidates.map(q => ({ text: q.text, marks: q.marks || 5 }));
        let classifications: any[] = [];
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.PARSER_URL}/classify-batch`, batch),
            );
            classifications = response.data;
        } catch (err: any) {
            throw new HttpException(`Classifier service error: ${err.message}`, HttpStatus.BAD_GATEWAY);
        }

        // Update each question
        let updated = 0;
        for (let i = 0; i < candidates.length; i++) {
            const q = candidates[i];
            const cls = classifications[i];
            if (!cls) continue;

            // Do NOT overwrite teacher-confirmed fields
            if (q.classification_source === 'teacher') continue;

            const updateData: any = {
                blooms_level: this.normalizeBloomsLevel(cls.blooms_level),
                difficulty: this.normalizeDifficulty(cls.difficulty),
                question_type: cls.question_type || 'Short Answer',
                classification_source: 'ai',
                metadata: cls.metadata || {},
            };

            // If question has no unit or was default, and classifier detected one, assign it
            if (cls.unit && (!q.unit || q.unit === 'Unit 1')) {
                updateData.unit = cls.unit;
            }

            // If marks was 5 and classifier inferred a more appropriate marks value, update it
            if (q.marks === 5 && cls.marks && cls.marks !== 5) {
                updateData.marks = cls.marks;
            }

            await this.supabaseService
                .getClient()
                .from('questions')
                .update(updateData)
                .eq('id', q.id);

            updated++;
        }

        return { processed: updated, total_found: candidates.length };
    }

    // -------------------------------------------------------------------------
    // HELPERS: Normalize enum values to match Supabase enum constraints
    // -------------------------------------------------------------------------
    private normalizeDifficulty(value: string | null | undefined): 'Easy' | 'Medium' | 'Hard' {
        if (!value) return 'Medium';
        const v = String(value).trim();
        if (v === 'Easy' || v === 'easy') return 'Easy';
        if (v === 'Hard' || v === 'hard') return 'Hard';
        return 'Medium';
    }

    private normalizeBloomsLevel(value: string | null | undefined): string | null {
        if (!value) return null;
        const valid = ['L1_Remember', 'L2_Understand', 'L3_Apply', 'L4_Analyze', 'L5_Evaluate', 'L6_Create'];
        if (valid.includes(value)) return value;
        // Try mapping short names
        const short: Record<string, string> = {
            'Remember': 'L1_Remember', 'remember': 'L1_Remember',
            'Understand': 'L2_Understand', 'understand': 'L2_Understand',
            'Apply': 'L3_Apply', 'apply': 'L3_Apply',
            'Analyze': 'L4_Analyze', 'analyze': 'L4_Analyze',
            'Evaluate': 'L5_Evaluate', 'evaluate': 'L5_Evaluate',
            'Create': 'L6_Create', 'create': 'L6_Create',
        };
        return short[value] || null;
    }
}
