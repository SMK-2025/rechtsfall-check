export type DocumentPageFinding = {
  pageNumber: number;
  summary: string;
  statements: string[];
  warnings: string[];
};

export type StructuredDocumentExtraction = {
  documentType: string;
  summary: string;
  parties: string[];
  dates: string[];
  amounts: string[];
  statements: string[];
  possibleDeadlines: string[];
  warnings: string[];
  pageCount: number;
  isScanned: boolean;
  ocrApplied: boolean;
  confidence: number;
  pages: DocumentPageFinding[];
};

export type DocumentPipelineResult = StructuredDocumentExtraction & {
  pipeline: {
    provider: "openai";
    version: "document-pipeline-v1";
    processedAt: string;
    quality: "HIGH" | "MEDIUM" | "LOW";
    requiresManualReview: boolean;
  };
};

export interface DocumentExtractor {
  readonly provider: "openai";
  supports(mimeType: string): boolean;
  extract(): Promise<StructuredDocumentExtraction>;
}

export class OpenAiDocumentExtractor implements DocumentExtractor {
  readonly provider = "openai" as const;

  constructor(
    private readonly mimeType: string,
    private readonly extraction: () => Promise<StructuredDocumentExtraction>,
  ) {}

  supports(mimeType: string) {
    return mimeType === this.mimeType
      && ["application/pdf", "image/jpeg", "image/png"].includes(mimeType);
  }

  extract() {
    return this.extraction();
  }
}

function normalizeExtraction(extraction: StructuredDocumentExtraction): StructuredDocumentExtraction {
  const confidence = Math.max(0, Math.min(100, Math.round(Number(extraction.confidence) || 0)));
  const pages = (extraction.pages || [])
    .filter(page => Number.isFinite(page.pageNumber) && page.pageNumber > 0)
    .map(page => ({
      pageNumber: Math.round(page.pageNumber),
      summary: String(page.summary || "").slice(0, 2_000),
      statements: (page.statements || []).map(value => String(value).slice(0, 1_000)).slice(0, 30),
      warnings: (page.warnings || []).map(value => String(value).slice(0, 1_000)).slice(0, 20),
    }))
    .sort((a, b) => a.pageNumber - b.pageNumber);
  return {
    ...extraction,
    confidence,
    pageCount: Math.max(1, Math.round(Number(extraction.pageCount) || pages.length || 1)),
    pages,
    warnings: [...new Set((extraction.warnings || []).map(value => String(value).slice(0, 1_000)))].slice(0, 30),
  };
}

export async function runDocumentPipeline(extractor: DocumentExtractor): Promise<DocumentPipelineResult> {
  if (!extractor.supports("application/pdf") && !extractor.supports("image/jpeg") && !extractor.supports("image/png")) {
    throw new Error("OCR_PROVIDER_UNSUPPORTED");
  }
  const extraction = normalizeExtraction(await extractor.extract());
  const pageWarnings = extraction.pages.flatMap(page => page.warnings);
  const requiresManualReview = extraction.confidence < 70
    || extraction.warnings.length > 0
    || pageWarnings.length > 0;
  const quality = extraction.confidence >= 85 && !requiresManualReview
    ? "HIGH"
    : extraction.confidence >= 60 ? "MEDIUM" : "LOW";
  return {
    ...extraction,
    pipeline: {
      provider: extractor.provider,
      version: "document-pipeline-v1",
      processedAt: new Date().toISOString(),
      quality,
      requiresManualReview,
    },
  };
}
