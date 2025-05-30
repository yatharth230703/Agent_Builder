export interface WizardConfig {
  approach: string;
  framework: string;
  llmProvider: string;
  toolUse: string;
  embedder: string;
  vectorDb: string;
  customUrls?: string[];
}
