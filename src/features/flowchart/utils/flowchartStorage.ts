import type { FlowchartDocument } from '../model/types';
import { initialFlowchart } from '../model/initialFlowchart';

export const STORAGE_KEY = 'clinical-flowchart-editor.document';

function isFlowchartDocument(value: unknown): value is FlowchartDocument {
    if (typeof value !== 'object' || value === null) return false;
    const doc = value as Record<string, unknown>;
    return (
        typeof doc.title === 'string' &&
        typeof doc.version === 'string' &&
        Array.isArray(doc.nodes) &&
        Array.isArray(doc.edges)
    );
}

export function saveToStorage(doc: FlowchartDocument): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
        // localStorage unavailable (SSR / environments without storage)
    }
}

export function loadFromStorage(): FlowchartDocument {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return initialFlowchart;
        const parsed: unknown = JSON.parse(raw);
        if (isFlowchartDocument(parsed)) return parsed;
        return initialFlowchart;
    } catch {
        return initialFlowchart;
    }
}
