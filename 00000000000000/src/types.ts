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

export interface OrderDetails {
  id: string;
  orderNumber: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  country: string;
  city: string;
  address: string;
  brushColor: "pink" | "purple" | "black";
  packageType: "single" | "gift_set";
  paymentMethod: "card" | "cod" | "apple_pay";
  totalAmount: number;
  orderedAt: string;
  status: "confirmed" | "preparing" | "shipped" | "delivered";
}
