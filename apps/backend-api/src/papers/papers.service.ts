import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export class GeneratePaperDto {
    blueprint_id?: string;
    blueprint?: any;
    bank_id?: string;
    bank_ids?: string[];
    title?: string;
    exam_type?: string;
    subject_code?: string;
    set_name?: string;
    difficulty_preset?: 'Balanced' | 'Easy' | 'Moderate' | 'Challenging';
    selected_units?: string[];
    selected_blooms?: string[];
    avoid_question_ids?: string[];
}

export class UpdatePaperStatusDto {
    status: 'Draft' | 'Submitted_For_Review' | 'Approved' | 'Rejected' | 'Generated';
    moderation_comments?: string;
}

export class ReplaceQuestionDto {
    section_index: number;
    question_index: number;
    new_question_id?: string;
    bank_id?: string;
}

@Injectable()
export class PapersService {
    constructor(private supabaseService: SupabaseService) { }

    // -------------------------------------------------------------------------
    // GENERATE PAPER
    // -------------------------------------------------------------------------
    async generate(dto: GeneratePaperDto) {
        const client = this.supabaseService.getClient();

        // 1. Resolve Blueprint
        let blueprint: any = null;
        if (dto.blueprint_id) {
            const { data: bpData, error: bpErr } = await client
                .from('exam_blueprints')
                .select('*')
                .eq('id', dto.blueprint_id)
                .single();

            if (bpErr || !bpData) {
                throw new NotFoundException(`Blueprint ${dto.blueprint_id} not found`);
            }
            blueprint = {
                id: bpData.id,
                title: bpData.title,
                exam_type: bpData.exam_type,
                subject_code: bpData.subject_code,
                total_marks: bpData.total_marks,
                duration_minutes: bpData.duration_minutes,
                instructions: bpData.instructions || [],
                sections: bpData.schema?.sections || [],
            };
        } else if (dto.blueprint && dto.blueprint.sections) {
            blueprint = dto.blueprint;
        } else {
            throw new HttpException('Either blueprint_id or inline blueprint object with sections must be provided', HttpStatus.BAD_REQUEST);
        }

        const sections = blueprint.sections || [];
        if (sections.length === 0) {
            throw new HttpException('Blueprint has no sections configured', HttpStatus.BAD_REQUEST);
        }

        // 2. Resolve Bank IDs
        const bankIds: string[] = [];
        if (dto.bank_ids && Array.isArray(dto.bank_ids) && dto.bank_ids.length > 0) {
            bankIds.push(...dto.bank_ids);
        } else if (dto.bank_id) {
            bankIds.push(dto.bank_id);
        }

        // 3. Query Questions Pool
        let query = client.from('questions').select('*');
        if (bankIds.length === 1) {
            query = query.eq('bank_id', bankIds[0]);
        } else if (bankIds.length > 1) {
            query = query.in('bank_id', bankIds);
        }

        const { data: questionsPool, error: poolError } = await query;
        if (poolError) {
            throw new HttpException(`Failed to fetch questions pool: ${poolError.message}`, HttpStatus.BAD_GATEWAY);
        }

        const allQuestions: any[] = questionsPool || [];
        if (allQuestions.length === 0) {
            throw new HttpException('No questions found in the selected question bank(s). Please upload or select a valid question bank.', HttpStatus.BAD_REQUEST);
        }

        // 4. Algorithm: Select Questions for each Section satisfying constraints
        const avoidIds = new Set<string>(dto.avoid_question_ids || []);
        const usedIds = new Set<string>();
        const warnings: string[] = [];
        const builtSections: any[] = [];

        // Difficulty preset targets
        const diffPreset = dto.difficulty_preset || 'Balanced';

        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
            const sec = sections[sIdx];
            const targetMarks = Number(sec.marks_per_question ?? sec.marksPerQuestion ?? 5);
            const targetCount = Number(sec.number_of_questions ?? sec.numberOfQuestions ?? sec.targetCount ?? 1);
            const secName = sec.name || `Section ${String.fromCharCode(65 + sIdx)}`;

            // Candidates matching marks and not yet used
            let candidates = allQuestions.filter(q => {
                if (usedIds.has(q.id) || avoidIds.has(q.id)) return false;
                const qMarks = Number(q.marks || 5);
                return qMarks === targetMarks;
            });

            // Filter by selected units if requested
            if (dto.selected_units && dto.selected_units.length > 0) {
                const unitCandidates = candidates.filter(q => {
                    const u = q.unit || q.topic || '';
                    return dto.selected_units!.some(su => u.toLowerCase().includes(su.toLowerCase()));
                });
                if (unitCandidates.length >= targetCount) {
                    candidates = unitCandidates;
                } else if (unitCandidates.length > 0) {
                    // Use available and warn
                    warnings.push(`${secName}: Only ${unitCandidates.length} of ${targetCount} questions match the selected units; included other units to satisfy count.`);
                }
            }

            // Filter by section difficulty constraints if specified
            if (sec.difficulty && Array.isArray(sec.difficulty) && sec.difficulty.length > 0) {
                const diffCandidates = candidates.filter(q => sec.difficulty.includes(q.difficulty));
                if (diffCandidates.length >= targetCount) {
                    candidates = diffCandidates;
                } else {
                    warnings.push(`${secName}: Not enough questions matching difficulty [${sec.difficulty.join(', ')}]. Relaxed difficulty constraint.`);
                }
            }

            // Filter by Bloom's levels if specified
            if (sec.blooms_levels && Array.isArray(sec.blooms_levels) && sec.blooms_levels.length > 0) {
                const bloomCandidates = candidates.filter(q => sec.blooms_levels.includes(q.blooms_level));
                if (bloomCandidates.length >= targetCount) {
                    candidates = bloomCandidates;
                }
            }

            // If not enough questions matching exact marks, allow close marks (+-2) as fallback
            if (candidates.length < targetCount) {
                const fallbackCandidates = allQuestions.filter(q => {
                    if (usedIds.has(q.id) || avoidIds.has(q.id)) return false;
                    const diff = Math.abs(Number(q.marks || 5) - targetMarks);
                    return diff <= 2;
                });
                if (fallbackCandidates.length > candidates.length) {
                    candidates = fallbackCandidates;
                    warnings.push(`${secName}: Insufficient ${targetMarks}-mark questions; selected close-mark alternatives.`);
                }
            }

            // Sort candidates by AI classification confidence descending (favor high-quality questions)
            candidates.sort((a, b) => {
                const confA = a.metadata?.confidence?.overall || 0.5;
                const confB = b.metadata?.confidence?.overall || 0.5;
                return confB - confA;
            });

            // Pick questions
            const selectedForSec: any[] = [];
            for (let i = 0; i < targetCount && i < candidates.length; i++) {
                const pick = candidates[i];
                usedIds.add(pick.id);
                selectedForSec.push({
                    id: pick.id,
                    text: pick.text || pick.question_text,
                    marks: targetMarks,
                    difficulty: pick.difficulty || 'Medium',
                    blooms_level: pick.blooms_level || 'L2_Understand',
                    topic: pick.topic || pick.subject || 'General',
                    unit: pick.unit || 'Unit 1',
                    co: pick.co || 'CO1',
                    question_type: pick.question_type || 'Short Answer',
                    classification_source: pick.classification_source || 'ai',
                });
            }

            if (selectedForSec.length < targetCount) {
                warnings.push(`${secName}: Requested ${targetCount} questions, but only ${selectedForSec.length} available matching criteria.`);
            }

            builtSections.push({
                id: sec.id || `s${sIdx + 1}`,
                name: secName,
                marksPerQuestion: targetMarks,
                targetCount,
                totalMarks: targetMarks * selectedForSec.length,
                questions: selectedForSec,
            });
        }

        // 5. Compute Distribution Statistics
        const allSelectedQuestions = builtSections.flatMap(s => s.questions);
        const totalCount = allSelectedQuestions.length;

        const diffCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
        const bloomsCounts: Record<string, number> = {};
        const unitCounts: Record<string, number> = {};
        let actualTotalMarks = 0;

        for (const q of allSelectedQuestions) {
            actualTotalMarks += q.marks;
            const diff = q.difficulty || 'Medium';
            diffCounts[diff] = (diffCounts[diff] || 0) + 1;

            const bloom = q.blooms_level || 'L2_Understand';
            bloomsCounts[bloom] = (bloomsCounts[bloom] || 0) + 1;

            const unit = q.unit || 'Unit 1';
            unitCounts[unit] = (unitCounts[unit] || 0) + 1;
        }

        const stats = {
            total_questions: totalCount,
            total_marks: actualTotalMarks,
            difficulty_distribution: {
                counts: diffCounts,
                percentages: {
                    Easy: totalCount > 0 ? Math.round((diffCounts.Easy / totalCount) * 100) : 0,
                    Medium: totalCount > 0 ? Math.round((diffCounts.Medium / totalCount) * 100) : 0,
                    Hard: totalCount > 0 ? Math.round((diffCounts.Hard / totalCount) * 100) : 0,
                },
            },
            blooms_distribution: bloomsCounts,
            unit_distribution: unitCounts,
        };

        const isValid = warnings.length === 0;

        // 6. Build Content Structure
        const content = {
            header: {
                title: dto.title || blueprint.title || 'Examination Question Paper',
                subject_code: dto.subject_code || blueprint.subject_code || 'EXAM-101',
                duration_minutes: blueprint.duration_minutes || 90,
                total_marks: blueprint.total_marks || actualTotalMarks,
                instructions: blueprint.instructions || [
                    'Answer all questions in sequential order.',
                    'Figures to the right indicate full marks.',
                    'Assume suitable data wherever necessary.',
                ],
                set_name: dto.set_name || 'Set A',
            },
            sections: builtSections,
            stats,
            validation: {
                is_valid: isValid,
                warnings,
            },
            blueprint_id: blueprint.id || null,
        };

        // 7. Persist into Supabase `generated_papers`
        const normalizedExamType = this.normalizeExamType(dto.exam_type || blueprint.exam_type) || 'Unit_Test_1';

        const { data: savedData, error: saveError } = await client
            .from('generated_papers')
            .insert([{
                blueprint_id: blueprint.id || null,
                title: dto.title || blueprint.title || 'Examination Paper',
                exam_type: normalizedExamType,
                set_name: dto.set_name || 'Set A',
                status: 'Generated',
                total_marks: actualTotalMarks,
                content,
            }])
            .select();

        if (saveError) {
            // If foreign key fails because blueprint is custom/ephemeral, retry with null blueprint_id
            if (saveError.message.includes('foreign key') || saveError.message.includes('fkey')) {
                const { data: retryData, error: retryError } = await client
                    .from('generated_papers')
                    .insert([{
                        blueprint_id: null,
                        title: dto.title || blueprint.title || 'Examination Paper',
                        exam_type: normalizedExamType,
                        set_name: dto.set_name || 'Set A',
                        status: 'Generated',
                        total_marks: actualTotalMarks,
                        content,
                    }])
                    .select();

                if (retryError) throw new HttpException(`Failed to persist paper: ${retryError.message}`, HttpStatus.BAD_GATEWAY);
                return this.formatPaper(retryData[0]);
            }
            throw new HttpException(`Failed to persist paper: ${saveError.message}`, HttpStatus.BAD_GATEWAY);
        }

        return this.formatPaper(savedData[0]);
    }

    // -------------------------------------------------------------------------
    // FIND ALL
    // -------------------------------------------------------------------------
    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('generated_papers')
            .select('id, blueprint_id, title, exam_type, set_name, status, total_marks, content, pdf_url, docx_url, moderation_comments, created_at')
            .order('created_at', { ascending: false });

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return (data || []).map(p => this.formatPaper(p));
    }

    // -------------------------------------------------------------------------
    // FIND ONE
    // -------------------------------------------------------------------------
    async findOne(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('generated_papers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) throw new NotFoundException(`Paper ${id} not found`);
        return this.formatPaper(data);
    }

    // -------------------------------------------------------------------------
    // UPDATE STATUS / MODERATION
    // -------------------------------------------------------------------------
    async updateStatus(id: string, dto: UpdatePaperStatusDto) {
        const payload: any = {
            status: dto.status,
        };
        if (dto.moderation_comments !== undefined) {
            payload.moderation_comments = dto.moderation_comments;
            payload.moderated_at = new Date().toISOString();
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('generated_papers')
            .update(payload)
            .eq('id', id)
            .select();

        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        return this.formatPaper(data[0]);
    }

    // -------------------------------------------------------------------------
    // REPLACE QUESTION (Teacher Manual Substitution)
    // -------------------------------------------------------------------------
    async replaceQuestion(paperId: string, dto: ReplaceQuestionDto) {
        const client = this.supabaseService.getClient();

        // 1. Fetch current paper
        const { data: paper, error: fetchErr } = await client
            .from('generated_papers')
            .select('*')
            .eq('id', paperId)
            .single();

        if (fetchErr || !paper) throw new NotFoundException(`Paper ${paperId} not found`);

        const content = paper.content || {};
        const sections = content.sections || [];

        if (dto.section_index < 0 || dto.section_index >= sections.length) {
            throw new HttpException('Invalid section index', HttpStatus.BAD_REQUEST);
        }

        const targetSection = sections[dto.section_index];
        const questions = targetSection.questions || [];

        if (dto.question_index < 0 || dto.question_index >= questions.length) {
            throw new HttpException('Invalid question index', HttpStatus.BAD_REQUEST);
        }

        let newQuestionObj: any = null;

        if (dto.new_question_id) {
            // Fetch explicit question
            const { data: qData, error: qErr } = await client
                .from('questions')
                .select('*')
                .eq('id', dto.new_question_id)
                .single();

            if (qErr || !qData) throw new NotFoundException(`Question ${dto.new_question_id} not found`);

            newQuestionObj = {
                id: qData.id,
                text: qData.text,
                marks: targetSection.marksPerQuestion || qData.marks || 5,
                difficulty: qData.difficulty || 'Medium',
                blooms_level: qData.blooms_level || 'L2_Understand',
                topic: qData.topic || 'General',
                unit: qData.unit || 'Unit 1',
                co: qData.co || 'CO1',
                question_type: qData.question_type || 'Short Answer',
                classification_source: qData.classification_source || 'ai',
            };
        } else {
            // Pick a candidate automatically from the same bank
            const currentIds = sections.flatMap((s: any) => (s.questions || []).map((q: any) => q.id));
            let qQuery = client.from('questions')
                .select('*')
                .eq('marks', targetSection.marksPerQuestion || 5)
                .not('id', 'in', `(${currentIds.join(',')})`);

            if (dto.bank_id) {
                qQuery = qQuery.eq('bank_id', dto.bank_id);
            }

            const { data: candidates, error: cErr } = await qQuery.limit(1);
            if (cErr || !candidates || candidates.length === 0) {
                throw new HttpException('No alternative question found with matching marks', HttpStatus.NOT_FOUND);
            }

            const cand = candidates[0];
            newQuestionObj = {
                id: cand.id,
                text: cand.text,
                marks: targetSection.marksPerQuestion,
                difficulty: cand.difficulty || 'Medium',
                blooms_level: cand.blooms_level || 'L2_Understand',
                topic: cand.topic || 'General',
                unit: cand.unit || 'Unit 1',
                co: cand.co || 'CO1',
                question_type: cand.question_type || 'Short Answer',
                classification_source: cand.classification_source || 'ai',
            };
        }

        // Swap
        questions[dto.question_index] = newQuestionObj;
        targetSection.questions = questions;
        sections[dto.section_index] = targetSection;
        content.sections = sections;

        // Recalculate stats
        const allQuestions = sections.flatMap((s: any) => s.questions || []);
        const totalCount = allQuestions.length;
        const diffCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
        const bloomsCounts: Record<string, number> = {};
        const unitCounts: Record<string, number> = {};

        for (const q of allQuestions) {
            diffCounts[q.difficulty || 'Medium'] = (diffCounts[q.difficulty || 'Medium'] || 0) + 1;
            bloomsCounts[q.blooms_level || 'L2_Understand'] = (bloomsCounts[q.blooms_level || 'L2_Understand'] || 0) + 1;
            unitCounts[q.unit || 'Unit 1'] = (unitCounts[q.unit || 'Unit 1'] || 0) + 1;
        }

        content.stats = {
            total_questions: totalCount,
            total_marks: allQuestions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0),
            difficulty_distribution: {
                counts: diffCounts,
                percentages: {
                    Easy: totalCount > 0 ? Math.round((diffCounts.Easy / totalCount) * 100) : 0,
                    Medium: totalCount > 0 ? Math.round((diffCounts.Medium / totalCount) * 100) : 0,
                    Hard: totalCount > 0 ? Math.round((diffCounts.Hard / totalCount) * 100) : 0,
                },
            },
            blooms_distribution: bloomsCounts,
            unit_distribution: unitCounts,
        };

        const { data: updated, error: upErr } = await client
            .from('generated_papers')
            .update({ content })
            .eq('id', paperId)
            .select();

        if (upErr) throw new HttpException(upErr.message, HttpStatus.BAD_GATEWAY);
        return this.formatPaper(updated[0]);
    }

    // -------------------------------------------------------------------------
    // CANDIDATES FOR MANUAL REPLACEMENT MODAL
    // -------------------------------------------------------------------------
    async getCandidates(bankId?: string, marks?: number, excludeIds?: string[]) {
        let query = this.supabaseService.getClient().from('questions').select('*');
        if (bankId) query = query.eq('bank_id', bankId);
        if (marks) query = query.eq('marks', marks);

        const { data, error } = await query.limit(50);
        if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);

        const excludeSet = new Set(excludeIds || []);
        return (data || []).filter(q => !excludeSet.has(q.id)).map(q => ({
            id: q.id,
            text: q.text,
            marks: q.marks,
            difficulty: q.difficulty,
            blooms_level: q.blooms_level,
            topic: q.topic,
            unit: q.unit,
            question_type: q.question_type,
        }));
    }

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    private formatPaper(raw: any) {
        if (!raw) return null;
        return {
            id: raw.id,
            blueprint_id: raw.blueprint_id,
            title: raw.title,
            exam_type: raw.exam_type,
            set_name: raw.set_name,
            status: raw.status,
            total_marks: raw.total_marks,
            totalMarks: raw.total_marks, // frontend alias
            content: raw.content,
            sections: raw.content?.sections || [],
            stats: raw.content?.stats || null,
            validation: raw.content?.validation || { is_valid: true, warnings: [] },
            date: new Date(raw.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            pdf_url: raw.pdf_url,
            docx_url: raw.docx_url,
            moderation_comments: raw.moderation_comments,
            created_at: raw.created_at,
        };
    }

    private normalizeExamType(value?: string): string | null {
        const valid = ['Unit_Test_1', 'Unit_Test_2', 'In_Sem', 'End_Sem_Final'];
        if (!value) return 'Unit_Test_1';
        if (valid.includes(value)) return value;
        const map: Record<string, string> = {
            'unit_test_1': 'Unit_Test_1', 'unit test 1': 'Unit_Test_1',
            'unit_test_2': 'Unit_Test_2', 'unit test 2': 'Unit_Test_2',
            'in_sem': 'In_Sem', 'in sem': 'In_Sem', 'mid-term': 'In_Sem', 'midterm': 'In_Sem',
            'end_sem': 'End_Sem_Final', 'end sem': 'End_Sem_Final',
            'end_sem_final': 'End_Sem_Final', 'final': 'End_Sem_Final',
        };
        return map[value.toLowerCase()] || 'Unit_Test_1';
    }

    async exportDocx(paperData: any): Promise<Buffer> {
        const parserUrl = process.env.PARSER_SERVICE_URL || 'http://localhost:8000';
        try {
            const res = await fetch(`${parserUrl}/export-pccoer-docx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paperData),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Parser service error: ${errText}`);
            }
            const arrayBuffer = await res.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (err: any) {
            throw new HttpException(`Failed to generate DOCX export: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

