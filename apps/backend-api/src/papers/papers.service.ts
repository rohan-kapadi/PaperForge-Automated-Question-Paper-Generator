import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export class CourseOutcomeDto {
    co: string;
    desc: string;
    bt: string;
}

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

    // --- PCCOER Autonomous College Exam Header Fields ---
    academic_year?: string;          // e.g. '2025 – 26'
    term?: string;                   // e.g. 'II'
    record_no?: string;              // e.g. 'ACAD/R/11'
    department?: string;             // e.g. 'Computer Engineering'
    student_class?: string;          // e.g. 'SE'
    div?: string;                    // e.g. 'A, B, C, D, E, F'
    subject_name?: string;           // e.g. 'Database Management Systems'
    max_marks?: number;              // e.g. 30
    duration?: string;               // e.g. '1 hr.'
    exam_date?: string;              // e.g. '16/02/2026'
    rev?: string;                    // e.g. '00'
    rev_date?: string;               // e.g. '01-09-2025'
    course_outcomes?: CourseOutcomeDto[];

    // --- OR-Pairing Mode ---
    // When true, sections are treated as paired (S1 ↔ S2, S3 ↔ S4).
    // Each pair generates Q1 (A,B,C) OR Q2 (A,B,C) with strict difficulty/Bloom's parity.
    use_or_pairing?: boolean;
    sub_questions_per_group?: number;   // default 3
    marks_per_sub_question?: number;    // default 5
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
        // Difficulty preset targets
        const diffPreset = dto.difficulty_preset || 'Balanced';

        // Check if blueprint already has OR choices defined in its section schema
        const hasBlueprintOrChoices = sections.some((s: any) => s.is_or_choice || s.isOrChoice);
        const isOrPairingActive = dto.use_or_pairing ?? hasBlueprintOrChoices;

        // When use_or_pairing is enabled from dto and blueprint has flat sections, expand them
        let effectiveSections = [...sections];
        if (dto.use_or_pairing && !hasBlueprintOrChoices) {
            if (sections.length === 2) {
                const subCount = dto.sub_questions_per_group || 3;
                const subMarks = dto.marks_per_sub_question || 5;
                effectiveSections = [
                    { ...sections[0], id: `${sections[0].id || 's1'}_q1`, name: 'Que 1', number_of_questions: subCount, marks_per_question: subMarks, is_or_choice: false },
                    { ...sections[0], id: `${sections[0].id || 's1'}_q2`, name: 'Que 2 (OR)', number_of_questions: subCount, marks_per_question: subMarks, is_or_choice: true, paired_with_id: `${sections[0].id || 's1'}_q1` },
                    { ...sections[1], id: `${sections[1].id || 's2'}_q3`, name: 'Que 3', number_of_questions: subCount, marks_per_question: subMarks, is_or_choice: false },
                    { ...sections[1], id: `${sections[1].id || 's2'}_q4`, name: 'Que 4 (OR)', number_of_questions: subCount, marks_per_question: subMarks, is_or_choice: true, paired_with_id: `${sections[1].id || 's2'}_q3` },
                ];
            } else if (sections.length === 1 && (sections[0].number_of_questions ?? sections[0].numberOfQuestions ?? 0) >= 6) {
                const subCount = dto.sub_questions_per_group || 3;
                const subMarks = dto.marks_per_sub_question || 5;
                effectiveSections = [
                    { ...sections[0], id: `${sections[0].id || 's1'}_q1`, name: 'Que 1', number_of_questions: subCount, marks_per_question: subMarks, is_or_choice: false },
                    { ...sections[0], id: `${sections[0].id || 's1'}_q2`, name: 'Que 2 (OR)', number_of_questions: subCount, marks_per_question: subMarks, is_or_choice: true, paired_with_id: `${sections[0].id || 's1'}_q1` },
                ];
            }
        }

        for (let sIdx = 0; sIdx < effectiveSections.length; sIdx++) {
            const sec = effectiveSections[sIdx];
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

            // If not enough questions matching exact marks, allow close marks (+-2) or any unused questions from bank
            if (candidates.length < targetCount) {
                let fallbackCandidates = allQuestions.filter(q => {
                    if (usedIds.has(q.id) || avoidIds.has(q.id)) return false;
                    const diff = Math.abs(Number(q.marks || 5) - targetMarks);
                    return diff <= 2;
                });
                if (fallbackCandidates.length < targetCount) {
                    fallbackCandidates = allQuestions.filter(q => !usedIds.has(q.id) && !avoidIds.has(q.id));
                }
                if (fallbackCandidates.length > candidates.length) {
                    candidates = fallbackCandidates;
                    warnings.push(`${secName}: Insufficient ${targetMarks}-mark questions; selected available bank alternatives.`);
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
            const isOrAlternative = dto.use_or_pairing && (sIdx % 2 === 1) && builtSections.length >= sIdx;
            const primarySec = isOrAlternative ? builtSections[sIdx - 1] : null;

            if (primarySec && primarySec.questions && primarySec.questions.length > 0) {
                // Pedagogical parity: pick questions mirroring the primary section's cognitive profile
                for (const primQ of primarySec.questions) {
                    if (selectedForSec.length >= targetCount) break;
                    const match = this.findMatchingCandidate(candidates, {
                        marks: targetMarks,
                        difficulty: primQ.difficulty,
                        blooms_level: primQ.blooms_level,
                        unit: primQ.unit,
                    });
                    if (match) {
                        usedIds.add(match.id);
                        candidates = candidates.filter(c => c.id !== match.id);
                        selectedForSec.push({
                            id: match.id,
                            text: match.text || match.question_text,
                            marks: targetMarks,
                            difficulty: match.difficulty || 'Medium',
                            blooms_level: match.blooms_level || 'L2_Understand',
                            topic: match.topic || match.subject || 'General',
                            unit: match.unit || 'Unit 1',
                            co: match.co || primQ.co || 'CO1',
                            question_type: match.question_type || 'Short Answer',
                            classification_source: match.classification_source || 'ai',
                        });
                    }
                }
            }

            // Fill remaining slots if any
            for (let i = 0; selectedForSec.length < targetCount && i < candidates.length; i++) {
                const pick = candidates[i];
                if (usedIds.has(pick.id)) continue;
                usedIds.add(pick.id);
                selectedForSec.push({
                    id: pick.id,
                    text: pick.text || pick.question_text,
                    marks: targetMarks,
                    difficulty: pick.difficulty || 'Medium',
                    blooms_level: pick.blooms_level || 'L2_Understand',
                    topic: pick.topic || pick.subject || 'General',
                    unit: pick.unit || 'Unit 1',
                    co: pick.co || `CO${(sIdx % 3) + 1}`,
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
                // Autonomous College Format (PCET PCCOER)
                academic_year: dto.academic_year || '2025 – 26',
                term: dto.term || 'II',
                exam_type_display: dto.exam_type || blueprint.exam_type || 'UNIT TEST',
                record_no: dto.record_no || 'ACAD/R/11',
                department: dto.department || 'Computer Engineering',
                student_class: dto.student_class || 'SE',
                div: dto.div || 'A, B, C, D, E, F',
                subject_name: dto.subject_name || dto.title || blueprint.title || '',
                max_marks: dto.max_marks || blueprint.total_marks || actualTotalMarks,
                duration: dto.duration || `${blueprint.duration_minutes || 90} Min`,
                exam_date: dto.exam_date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
                rev: dto.rev || '00',
                rev_date: dto.rev_date || '01-09-2025',
                course_outcomes: dto.course_outcomes || [],
                use_or_pairing: dto.use_or_pairing || false,
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

                if (!retryError && retryData && retryData.length > 0) {
                    return this.formatPaper(retryData[0]);
                }
            }

            // If table lacks newer columns (e.g. before migration is applied in Supabase), fallback gracefully
            if (saveError.message.includes('column') || saveError.message.includes('schema cache')) {
                const { data: minData } = await client
                    .from('generated_papers')
                    .insert([{
                        total_marks: actualTotalMarks,
                    }])
                    .select();

                const fallbackId = (minData && minData[0]?.id) ? minData[0].id : `gen-${Date.now()}`;
                return {
                    id: fallbackId,
                    blueprint_id: blueprint.id || null,
                    title: dto.title || blueprint.title || 'Examination Paper',
                    exam_type: normalizedExamType,
                    set_name: dto.set_name || 'Set A',
                    status: 'Generated',
                    total_marks: actualTotalMarks,
                    totalMarks: actualTotalMarks,
                    content,
                    sections: builtSections,
                    stats,
                    validation: { is_valid: isValid, warnings },
                    created_at: new Date().toISOString(),
                };
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
            .select('*')
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

        if (error) {
            if (error.message.includes('column') || error.message.includes('schema cache')) {
                return { id, status: dto.status, moderation_comments: dto.moderation_comments };
            }
            throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
        }
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

    private findMatchingCandidate(
        pool: any[],
        criteria: { marks: number; difficulty: string; blooms_level: string; unit?: string }
    ): any | null {
        // 1. Exact match on marks, diff, blooms, and unit
        const targetUnit = criteria.unit;
        if (targetUnit) {
            const exactUnit = pool.find(q =>
                Math.abs(Number(q.marks || 5) - criteria.marks) <= 1 &&
                q.difficulty === criteria.difficulty &&
                q.blooms_level === criteria.blooms_level &&
                (q.unit || '').toLowerCase().includes(targetUnit.toLowerCase())
            );
            if (exactUnit) return exactUnit;
        }

        // 2. Exact match on marks, diff, blooms
        const exact = pool.find(q =>
            Math.abs(Number(q.marks || 5) - criteria.marks) <= 1 &&
            q.difficulty === criteria.difficulty &&
            q.blooms_level === criteria.blooms_level
        );
        if (exact) return exact;

        // 3. Relax blooms level (match marks + difficulty)
        const matchDiff = pool.find(q =>
            Math.abs(Number(q.marks || 5) - criteria.marks) <= 1 &&
            q.difficulty === criteria.difficulty
        );
        if (matchDiff) return matchDiff;

        // 4. Relax difficulty (match marks)
        const matchMarks = pool.find(q =>
            Math.abs(Number(q.marks || 5) - criteria.marks) <= 1
        );
        if (matchMarks) return matchMarks;

        // 5. Ultimate fallback: any available question in pool
        return pool.length > 0 ? pool[0] : null;
    }
}

