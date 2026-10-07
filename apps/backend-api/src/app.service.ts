import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Injectable()
export class AppService {
  constructor(private readonly supabaseService: SupabaseService) { }

  getHello(): string {
    return 'ExamGen Core API is running';
  }

  async getStats() {
    const client = this.supabaseService.getClient();

    const [
      { count: banksCount },
      { count: questionsCount },
      { count: papersCount },
      { count: blueprintsCount },
      { data: recentPapers },
      { data: recentBanks },
    ] = await Promise.all([
      client.from('question_banks').select('*', { count: 'exact', head: true }),
      client.from('questions').select('*', { count: 'exact', head: true }),
      client.from('generated_papers').select('*', { count: 'exact', head: true }),
      client.from('exam_blueprints').select('*', { count: 'exact', head: true }),
      client.from('generated_papers').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(5),
      client.from('question_banks').select('id, name, file_name, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const activities: any[] = [];
    for (const p of recentPapers || []) {
      activities.push({
        action: 'Generated Paper',
        title: p.title,
        date: p.created_at,
        status: p.status === 'Approved' ? 'success' : 'warning',
      });
    }
    for (const b of recentBanks || []) {
      activities.push({
        action: 'Uploaded Question Bank',
        title: b.name || b.file_name || 'Question Bank',
        date: b.created_at,
        status: 'success',
      });
    }

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      questionBanks: banksCount ?? 0,
      totalQuestions: questionsCount ?? 0,
      papersGenerated: papersCount ?? 0,
      activeBlueprints: blueprintsCount ?? 0,
      recentActivity: activities.slice(0, 5),
    };
  }
}
