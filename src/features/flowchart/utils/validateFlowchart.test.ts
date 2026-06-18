import { describe, expect, it } from 'vitest';
import { initialFlowchart } from '../model/initialFlowchart';
import { validateFlowchartDocument } from './validateFlowchart';
import type { FlowchartDocument } from '../model/types';

const FIRST_ITEM_INDEX = 0;
const DUPLICATE_CONNECTION_EDGE_ID = 'e-duplicate-connection';
const END_SOURCE_EDGE_ID = 'e-end-source';
const START_TARGET_EDGE_ID = 'e-start-target';
const RESTRICTED_SOURCE_EXTRA_EDGE_ID = 'e-restricted-source-extra';
const EMPTY_LABEL = '';

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
                index === FIRST_ITEM_INDEX ? { ...node, title: '   ' } : node,
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

    it('flags edges that originate from end nodes', () => {
        const document = cloneDocument(initialFlowchart);
        const endNodeId = document.nodes.find((node) => node.type === 'end')?.id;
        const nonEndNodeId = document.nodes.find((node) => node.type !== 'end')?.id;

        expect(endNodeId).toBeTruthy();
        expect(nonEndNodeId).toBeTruthy();

        document.edges = [
            ...document.edges,
            {
                id: END_SOURCE_EDGE_ID,
                from: endNodeId!,
                to: nonEndNodeId!,
                label: EMPTY_LABEL,
            },
        ];

        const issues = validateFlowchartDocument(document);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'error',
                    code: 'invalid-edge-source-type',
                    edgeId: END_SOURCE_EDGE_ID,
                }),
            ]),
        );
    });

    it('flags edges that target start nodes', () => {
        const document = cloneDocument(initialFlowchart);
        const startNodeId = document.nodes.find((node) => node.type === 'start')?.id;
        const nonStartNodeId = document.nodes.find((node) => node.type !== 'start')?.id;

        expect(startNodeId).toBeTruthy();
        expect(nonStartNodeId).toBeTruthy();

        document.edges = [
            ...document.edges,
            {
                id: START_TARGET_EDGE_ID,
                from: nonStartNodeId!,
                to: startNodeId!,
                label: EMPTY_LABEL,
            },
        ];

        const issues = validateFlowchartDocument(document);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'error',
                    code: 'invalid-edge-target-type',
                    edgeId: START_TARGET_EDGE_ID,
                }),
            ]),
        );
    });

    it('flags duplicate source-target edge connections', () => {
        const document = cloneDocument(initialFlowchart);
        const sourceEdge = document.edges[FIRST_ITEM_INDEX];

        document.edges = [
            ...document.edges,
            {
                ...sourceEdge,
                id: DUPLICATE_CONNECTION_EDGE_ID,
            },
        ];

        const issues = validateFlowchartDocument(document);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'error',
                    code: 'duplicate-edge-connection',
                    edgeId: DUPLICATE_CONNECTION_EDGE_ID,
                }),
            ]),
        );
    });

    it('flags additional connections from sources with Ja/Nee/Start labels', () => {
        const document = cloneDocument(initialFlowchart);

        document.edges = [
            ...document.edges,
            {
                id: RESTRICTED_SOURCE_EXTRA_EDGE_ID,
                from: 'q_color',
                to: 'routine',
                label: EMPTY_LABEL,
            },
        ];

        const issues = validateFlowchartDocument(document);

        expect(issues).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: 'error',
                    code: 'restricted-source-additional-connection',
                    nodeId: 'q_color',
                }),
            ]),
        );
    });
});
