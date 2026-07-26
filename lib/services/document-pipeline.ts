export interface ExtractedDocument {
  text: string;
  pages: number;
  confidence: number;
  warnings: string[];
}

export interface DocumentExtractor {
  supports(mimeType: string): boolean;
  extract(bytes: ArrayBuffer, mimeType: string): Promise<ExtractedDocument>;
}

/** Adapter boundary for OCR/text providers. No provider is enabled in the MVP. */
export class DisabledExtractor implements DocumentExtractor {
  supports() { return false; }
  async extract(): Promise<ExtractedDocument> {
    throw new Error("OCR_PROVIDER_NOT_CONFIGURED");
  }
}
