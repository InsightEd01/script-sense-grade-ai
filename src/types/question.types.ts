export interface UpdateQuestionData {
  question_text?: string;
  model_answer?: string;
  model_answer_source?: 'uploaded' | 'ai_generated';
  marks?: number;
  tolerance?: number;
}
