export interface QuestionnaireAnswers {
  hairType: string;
  takesCare: string;
  isBrushImportant: string;
  predictedPrice: string;
  phoneNumber: string;
  email: string;
}

export interface WaitlistSubmission extends QuestionnaireAnswers {
  id: string;
  submittedAt: string;
  queueNumber: number;
}
