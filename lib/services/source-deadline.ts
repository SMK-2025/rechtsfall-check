export interface CandidateSource { id:string; title:string; jurisdiction:"DE"; validFrom?:string; validTo?:string; approval:"PENDING_LEGAL_REVIEW"|"APPROVED"; }
export interface DeadlineCandidate { label:string; basisSourceId:string; startFactId:string; endDate?:string; confidence:number; }

export interface LegalKnowledgePort {
  findCandidateSources(tags:string[], asOf:string):Promise<CandidateSource[]>;
  calculateCandidateDeadlines(sourceIds:string[], factIds:string[]):Promise<DeadlineCandidate[]>;
}

/** All returned sources/deadlines remain candidates until legal editorial approval. */
export class UnconfiguredLegalKnowledgePort implements LegalKnowledgePort {
  async findCandidateSources(){ return []; }
  async calculateCandidateDeadlines(){ return []; }
}
