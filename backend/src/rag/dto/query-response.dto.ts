export interface QueryResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
  }>;
  queryId: string;
  audioResponse?: string; // Base64 encoded audio for voice queries
  processingTime?: number;
  confidence?: number;
}