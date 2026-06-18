import type { FlowchartDocument, RouteLabel } from '../model/types';

const LOCKING_ROUTE_LABELS = new Set<RouteLabel>(['Ja', 'Nee', 'Start']);

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
    const nodeTypeById = new Map<string, string>();

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
        nodeTypeById.set(node.id, node.type);

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
    const edgeConnections = new Set<string>();
    const sourceStats = new Map<string, { hasLockingLabel: boolean; hasNonLockingLabel: boolean }>();

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

        if (nodeTypeById.get(edge.from) === 'end') {
            issues.push({
                severity: 'error',
                code: 'invalid-edge-source-type',
                message: `Edge ${edge.id} has invalid source type end`,
                edgeId: edge.id,
            });
        }

        if (nodeTypeById.get(edge.to) === 'start') {
            issues.push({
                severity: 'error',
                code: 'invalid-edge-target-type',
                message: `Edge ${edge.id} has invalid target type start`,
                edgeId: edge.id,
            });
        }

        const edgeConnectionKey = `${edge.from}->${edge.to}`;

        if (edgeConnections.has(edgeConnectionKey)) {
            issues.push({
                severity: 'error',
                code: 'duplicate-edge-connection',
                message: `Duplicate edge connection: ${edge.from} -> ${edge.to}`,
                edgeId: edge.id,
            });
        }

        edgeConnections.add(edgeConnectionKey);

        const sourceInfo = sourceStats.get(edge.from) ?? {
            hasLockingLabel: false,
            hasNonLockingLabel: false,
        };

        if (LOCKING_ROUTE_LABELS.has(edge.label)) {
            sourceInfo.hasLockingLabel = true;
        } else {
            sourceInfo.hasNonLockingLabel = true;
        }

        sourceStats.set(edge.from, sourceInfo);
    }

    for (const [sourceNodeId, sourceInfo] of sourceStats.entries()) {
        if (sourceInfo.hasLockingLabel && sourceInfo.hasNonLockingLabel) {
            issues.push({
                severity: 'error',
                code: 'restricted-source-additional-connection',
                message: `Node ${sourceNodeId} has additional connections after Ja/Nee/Start labels`,
                nodeId: sourceNodeId,
            });
        }
    }

    return issues;
}
