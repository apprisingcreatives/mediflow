import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface QuestionWithResponse {
  question_text: string;
  question_type: string;
  category: string | null;
  response_value: string | null;
  response_options: any;
}

interface DocumentForAnalysis {
  file_name: string;
  mime_type: string | null;
  file_path: string;
  description: string | null;
}

export interface AnalysisResult {
  recommended_specialty: string;
  recommended_treatments: string[];
  risk_factors: string[];
  predicted_conditions: string[];
  confidence_score: number;
  summary: string;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParseModule = await import('pdf-parse');
  const pdfParse = pdfParseModule.default ?? pdfParseModule;
  const data = await (pdfParse as any)(buffer);
  return data.text;
}

async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString('base64');
  const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: 'Extract all text from this medical document image. Return only the extracted text, nothing else.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text ?? '';
}

async function extractDocumentTexts(
  documents: DocumentForAnalysis[]
): Promise<{ fileName: string; text: string }[]> {
  const results: { fileName: string; text: string }[] = [];

  // Cap at 5 documents
  const docsToProcess = documents.slice(0, 5);

  for (const doc of docsToProcess) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('patient-documents')
        .download(doc.file_path);

      if (error || !data) {
        console.error(`Failed to download ${doc.file_name}:`, error);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      // Skip files larger than 10MB
      if (buffer.length > 10 * 1024 * 1024) {
        continue;
      }

      let text = '';
      if (doc.mime_type === 'application/pdf') {
        text = await extractTextFromPdf(buffer);
      } else if (
        doc.mime_type?.startsWith('image/')
      ) {
        text = await extractTextFromImage(buffer, doc.mime_type);
      }

      if (text.trim()) {
        results.push({ fileName: doc.file_name, text: text.trim() });
      }
    } catch (err) {
      console.error(`Error processing ${doc.file_name}:`, err);
    }
  }

  return results;
}

export async function analyzePatientHealth(
  responses: QuestionWithResponse[],
  documents: DocumentForAnalysis[]
): Promise<AnalysisResult> {
  // Build Q&A section
  const qaSection = responses
    .filter((r) => r.response_value || r.response_options)
    .map((r) => {
      const answer = r.response_options
        ? JSON.stringify(r.response_options)
        : r.response_value;
      return `Q (${r.category ?? 'General'}): ${r.question_text}\nA: ${answer}`;
    })
    .join('\n\n');

  // Extract text from documents
  const docTexts = await extractDocumentTexts(documents);
  const docSection = docTexts
    .map((d) => `--- Document: ${d.fileName} ---\n${d.text}`)
    .join('\n\n');

  const prompt = `You are a medical triage assistant. Analyze the following patient health information and provide recommendations.

## Patient Health Questionnaire Responses

${qaSection || 'No questionnaire responses provided.'}

## Uploaded Medical Documents

${docSection || 'No documents uploaded.'}

## Instructions

Based on the above information, provide a structured health analysis. Return ONLY valid JSON with this exact structure:

{
  "recommended_specialty": "the most appropriate medical specialty (e.g., General Practice, Cardiology, Endocrinology, Pulmonology, Psychiatry, Dermatology, Orthopedics, etc.)",
  "recommended_treatments": ["list of recommended treatments or follow-up actions"],
  "risk_factors": ["identified risk factors based on the patient's data"],
  "predicted_conditions": ["conditions that should be investigated based on the data"],
  "confidence_score": 0.85,
  "summary": "A 2-3 sentence explanation of your analysis and why you recommend this specialty."
}

Be conservative with confidence scores. Only assign >0.9 if the data strongly supports the recommendation. If the data is sparse, recommend General Practice with appropriate confidence.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const rawText = textBlock?.text ?? '{}';

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      recommended_specialty: 'General Practice',
      recommended_treatments: ['Schedule an initial consultation'],
      risk_factors: [],
      predicted_conditions: [],
      confidence_score: 0.5,
      summary: 'Unable to parse AI analysis. A general consultation is recommended.',
    };
  }

  try {
    return JSON.parse(jsonMatch[0]) as AnalysisResult;
  } catch {
    return {
      recommended_specialty: 'General Practice',
      recommended_treatments: ['Schedule an initial consultation'],
      risk_factors: [],
      predicted_conditions: [],
      confidence_score: 0.5,
      summary: 'Unable to parse AI analysis. A general consultation is recommended.',
    };
  }
}
