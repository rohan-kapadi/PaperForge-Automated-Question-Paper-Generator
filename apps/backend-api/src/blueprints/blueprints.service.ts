import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export class BlueprintSectionConfig {
    id: string;
    name: string;
    marks_per_question: number;
    number_of_questions: number;
    total_marks: number;
    difficulty?: string[];          // e.g. ['Easy', 'Medium']
    blooms_levels?: string[];       // e.g. ['L1_Remember', 'L2_Understand']
    question_types?: string[];      // e.g. ['Short Answer', 'Definition']
    units?: string[];               // e.g. ['Unit 1', 'Unit 2']
    is_or_choice?: boolean;         // True if this is an alternative OR choice section
    paired_with_id?: string;        // ID of the primary section this is paired with
    pair_label?: string;            // e.g. 'Que 1 OR Que 2'
}

export class CreateBlueprintDto {
    title: string;
    exam_type?: string;             // 'Unit_Test_1' | 'Unit_Test_2' | 'In_Sem' | 'End_Sem_Final'
    subject_code?: string;
    total_marks: number;
    duration_minutes: number;
    instructions?: string[];
    sections: BlueprintSectionConfig[];
    has_or_choices?: boolean;
}

@Injectable()
export class BlueprintsService {
    constructor(private supabaseService: SupabaseService) { }

    // -------------------------------------------------------------------------
    // CREATE
    // -------------------------------------------------------------------------
    async create(dto: CreateBlueprintDto) {
        // Calculate attempt marks (excluding alternative OR choices) vs gross printed marks
        const attemptMarksSum = dto.sections
            .filter(s => !s.is_or_choice)
            .reduce((acc, s) => acc + (s.marks_per_question * s.number_of_questions), 0);
        const grossMarksSum = dto.sections
            .reduce((acc, s) => acc + (s.marks_per_question * s.number_of_questions), 0);

        const hasOrChoices = dto.has_or_choices ?? dto.sections.some(s => s.is_or_choice);

        // Validation: total_marks can match either attempt marks (student target) or gross marks
        if (dto.total_marks !== attemptMarksSum && dto.total_marks !== grossMarksSum && grossMarksSum > 0) {
            throw new HttpException(
                `Section marks sum (Attempt: ${attemptMarksSum}M, Gross: ${grossMarksSum}M) does not match total_marks (${dto.total_marks}M). Please verify mark allocation.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const effectiveTotalMarks = attemptMarksSum > 0 ? attemptMarksSum : dto.total_marks;

        const { data, error } = await this.supabaseService
            .getClient()
            .from('exam_blueprints')
            .insert([{
                title: dto.title,
                exam_type: this.normalizeExamType(dto.exam_type) || 'Unit_Test_1',
                subject_code: dto.subject_code || null,
                total_marks: effectiveTotalMarks,
                duration_minutes: dto.duration_minutes,
                instructions: dto.instructions || [],
                schema: {
                    sections: dto.sections,
                    has_or_choices: hasOrChoices,
                    attempt_marks: attemptMarksSum,
                    gross_marks: grossMarksSum,
                },
            }])
            .select();

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return this.formatBlueprint(data[0]);
    }

    // -------------------------------------------------------------------------
    // READ ALL
    // -------------------------------------------------------------------------
    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('exam_blueprints')
            .select('id, title, exam_type, subject_code, total_marks, duration_minutes, instructions, schema, created_at')
            .order('created_at', { ascending: false });

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return (data ?? []).map(b => this.formatBlueprint(b));
    }

    // -------------------------------------------------------------------------
    // READ ONE
    // -------------------------------------------------------------------------
    async findOne(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('exam_blueprints')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) throw new NotFoundException(`Blueprint ${id} not found`);
        return this.formatBlueprint(data);
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------
    async update(id: string, dto: Partial<CreateBlueprintDto>) {
        const updatePayload: any = {};
        if (dto.title) updatePayload.title = dto.title;
        if (dto.exam_type) updatePayload.exam_type = this.normalizeExamType(dto.exam_type);
        if (dto.subject_code !== undefined) updatePayload.subject_code = dto.subject_code;
        if (dto.total_marks !== undefined) updatePayload.total_marks = dto.total_marks;
        if (dto.duration_minutes !== undefined) updatePayload.duration_minutes = dto.duration_minutes;
        if (dto.instructions !== undefined) updatePayload.instructions = dto.instructions;
        if (dto.sections !== undefined) {
            updatePayload.schema = { sections: dto.sections };
            if (!dto.total_marks) {
                updatePayload.total_marks = dto.sections.reduce(
                    (acc, s) => acc + (s.marks_per_question * s.number_of_questions), 0
                );
            }
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('exam_blueprints')
            .update(updatePayload)
            .eq('id', id)
            .select();

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return this.formatBlueprint(data[0]);
    }

    // -------------------------------------------------------------------------
    // DELETE
    // -------------------------------------------------------------------------
    async remove(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('exam_blueprints')
            .delete()
            .eq('id', id)
            .select();
        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return data[0];
    }

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    private formatBlueprint(raw: any) {
        if (!raw) return null;
        const schema = raw.schema || {};
        const sections: BlueprintSectionConfig[] = schema.sections || [];
        const hasOrChoices = schema.has_or_choices ?? sections.some(s => s.is_or_choice);
        return {
            id: raw.id,
            title: raw.title,
            name: raw.title,  // alias for frontend compatibility
            exam_type: raw.exam_type,
            subject_code: raw.subject_code,
            total_marks: raw.total_marks,
            totalMarks: raw.total_marks,
            duration_minutes: raw.duration_minutes,
            instructions: raw.instructions || [],
            sections,
            has_or_choices: hasOrChoices,
            attempt_marks: schema.attempt_marks || raw.total_marks,
            gross_marks: schema.gross_marks || raw.total_marks,
            schema,
            created_at: raw.created_at,
        };
    }

    private normalizeExamType(value?: string): string | null {
        const valid = ['Unit_Test_1', 'Unit_Test_2', 'In_Sem', 'End_Sem_Final'];
        if (!value) return null;
        if (valid.includes(value)) return value;
        // Map common names
        const map: Record<string, string> = {
            'unit_test_1': 'Unit_Test_1', 'unit test 1': 'Unit_Test_1',
            'unit_test_2': 'Unit_Test_2', 'unit test 2': 'Unit_Test_2',
            'in_sem': 'In_Sem', 'in sem': 'In_Sem', 'mid-term': 'In_Sem', 'midterm': 'In_Sem',
            'end_sem': 'End_Sem_Final', 'end sem': 'End_Sem_Final',
            'end_sem_final': 'End_Sem_Final', 'final': 'End_Sem_Final',
        };
        return map[value.toLowerCase()] || null;
    }
}
