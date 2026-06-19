import type { FlowchartDocument } from '../model/types';
import { initialFlowchart } from '../model/initialFlowchart';

export const STORAGE_KEY = 'clinical-flowchart-editor.document';

function isFlowchartDocument(value: unknown): value is FlowchartDocument {
    if (typeof value !== 'object' || value === null) return false;
    const doc = value as Record<string, unknown>;
    const viewport = doc.viewport as Record<string, unknown> | null | undefined;

    return (
        typeof doc.title === 'string' &&
        typeof doc.version === 'string' &&
        (doc.status === 'Concept' || doc.status === 'Review' || doc.status === 'Goedgekeurd') &&
        Array.isArray(doc.nodes) &&
        Array.isArray(doc.edges) &&
        (typeof doc.selectedNodeId === 'string' || doc.selectedNodeId === null) &&
        (typeof doc.selectedEdgeId === 'string' || doc.selectedEdgeId === null) &&
        typeof viewport === 'object' &&
        viewport !== null &&
        typeof viewport.x === 'number' &&
        typeof viewport.y === 'number' &&
        typeof viewport.scale === 'number'
    );
}

export function saveToStorage(doc: FlowchartDocument): boolean {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
        return true;
    } catch {
        // localStorage unavailable (SSR / environments without storage)
        return false;
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
