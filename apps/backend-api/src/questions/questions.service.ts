import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class QuestionsService {
    constructor(private supabaseService: SupabaseService) { }

    async findAll() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questions')
            .select('*');
        if (error) throw error;
        return data;
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
}
