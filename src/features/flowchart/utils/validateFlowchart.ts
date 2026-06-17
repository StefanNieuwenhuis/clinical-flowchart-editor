import type { FlowchartDocument } from '../model/types';

export type ValidationIssue = {
    severity: 'error' | 'warning';
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
};

export function validateFlowchartDocument(
    document: FlowchartDocument,
): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const nodeIds = new Set<string>();
    for (const node of document.nodes) {
        if (nodeIds.has(node.id)) {
            issues.push({
                severity: 'error',
                code: 'duplicate-node-id',
                message: `Duplicate node id: ${node.id}`,
                nodeId: node.id,
            });
        }
        nodeIds.add(node.id);

        if (!node.title.trim()) {
            issues.push({
                severity: 'warning',
                code: 'empty-node-title',
                message: `Node ${node.id} has an empty title`,
                nodeId: node.id,
            });
        }
    }

    const edgeIds = new Set<string>();
    for (const edge of document.edges) {
        if (edgeIds.has(edge.id)) {
            issues.push({
                severity: 'error',
                code: 'duplicate-edge-id',
                message: `Duplicate edge id: ${edge.id}`,
                edgeId: edge.id,
            });
        }
        edgeIds.add(edge.id);

        if (!nodeIds.has(edge.from)) {
            issues.push({
                severity: 'error',
                code: 'missing-edge-source',
                message: `Edge ${edge.id} points from missing node ${edge.from}`,
                edgeId: edge.id,
            });
        }

        if (!nodeIds.has(edge.to)) {
            issues.push({
                severity: 'error',
                code: 'missing-edge-target',
                message: `Edge ${edge.id} points to missing node ${edge.to}`,
                edgeId: edge.id,
            });
        }
    }

    return issues;
}