// These are the things returned by the intelligent dictionary click-in-text API
// that are actually used by this package.

export interface SerializedDefinition {
    text: string;
    source_ids: string[];
}
export interface SerializedWordform {
    text: string;
    definitions: SerializedDefinition[];
}
export interface SerializedSearchResult {
    lemma_wordform: SerializedWordform;
}
