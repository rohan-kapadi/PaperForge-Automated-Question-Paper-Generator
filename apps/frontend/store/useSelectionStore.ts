import { create } from 'zustand';

export interface Question {
    id: string;
    question_text: string;
    subject: string;
    marks?: number;
    difficulty?: string;
}

interface SelectionStore {
    selectedQuestions: Question[];
    addQuestion: (question: Question) => void;
    removeQuestion: (questionId: string) => void;
    clearSelection: () => void;
    totalMarks: () => number;
    isSelected: (questionId: string) => boolean;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
    selectedQuestions: [],

    addQuestion: (question) =>
        set((state) => ({
            selectedQuestions: [...state.selectedQuestions, question],
        })),

    removeQuestion: (questionId) =>
        set((state) => ({
            selectedQuestions: state.selectedQuestions.filter((q) => q.id !== questionId),
        })),

    clearSelection: () => set({ selectedQuestions: [] }),

    totalMarks: () => {
        const state = get();
        return state.selectedQuestions.reduce((sum, q) => sum + (q.marks || 5), 0);
    },

    isSelected: (questionId) => {
        const state = get();
        return state.selectedQuestions.some((q) => q.id === questionId);
    },
}));
