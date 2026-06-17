import { describe, expect, it } from 'vitest';
import { initialFlowchart } from '../model/initialFlowchart';
import { validateFlowchartDocument } from './validateFlowchart';
import type { FlowchartDocument } from '../model/types';

function cloneDocument(document: FlowchartDocument): FlowchartDocument {
    return structuredClone(document);
}

describe('validateFlowchartDocument', () => {
    it('returns no issues for a valid document', () => {
        const issues = validateFlowchartDocument(initialFlowchart);

        expect(issues).toEqual([]);
    });

    it('flags a missing edge endpoint', () => {
        const document = cloneDocument(initialFlowchart);
        document.edges = [
            {
                ...document.edges[0],
                to: 'missing-node',
            },
        ];

        const issues = validateFlowchartDocument(document);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'error',
                    code: 'missing-edge-target',
                    edgeId: document.edges[0].id,
                }),
            ]),
        );
    });

    it('flags duplicate node ids', () => {
        const document = cloneDocument(initialFlowchart);
        document.nodes = [
            ...document.nodes,
            {
                ...document.nodes[0],
            },
        ];

        const issues = validateFlowchartDocument(document);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'error',
                    code: 'duplicate-node-id',
                    nodeId: document.nodes[0].id,
                }),
            ]),
        );
    });

    it('flags nodes with empty titles', () => {
        const validDocument = cloneDocument(initialFlowchart);
        const document = {
            ...validDocument,
            nodes: validDocument.nodes.map((node, index) =>
                index === 0 ? { ...node, title: '   ' } : node,
            ),
        };

        const issues = validateFlowchartDocument(document);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    code: 'empty-node-title',
                    severity: 'warning',
                }),
            ]),
        );
    });
});