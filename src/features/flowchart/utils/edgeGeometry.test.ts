import {describe, expect, it} from 'vitest';
import {
    CONNECTOR_OFFSET,
    getEdgeLabelPosition,
    getEdgePath,
    getNodeCenter,
    getSourceConnectorCenter,
    getTargetConnectorCenter,
} from "./edgeGeometry.ts";
import {NODE_HEIGHT, NODE_WIDTH} from "./graphBounds.ts";
import type {FlowNode} from "../model/types.ts";

const mocked_edge_bounds = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
};

function createTestNode(overrides: Partial<FlowNode> = {}): FlowNode {
    return {
        id: 'node-1',
        type: 'decision',
        title: 'Question',
        body: '',
        x: 100,
        y: 200,
        ...overrides,
    };
}

describe('edgeGeometry', () => {
    it('should get the center of a node', () => {
        const node: FlowNode = createTestNode({ x: 100, y: 200 });

        expect(getNodeCenter(node)).toEqual({
            x: 100 + NODE_WIDTH / 2,
            y: 200 + NODE_HEIGHT / 2,
        });
    });

    it('should calculate connector centers using rendered node height', () => {
        const sourceNode = createTestNode({ id: 'source', x: 100, y: 200 });
        const targetNode = createTestNode({ id: 'target', x: 500, y: 240 });

        expect(getSourceConnectorCenter(sourceNode, 144)).toEqual({
            x: sourceNode.x + NODE_WIDTH - CONNECTOR_OFFSET,
            y: sourceNode.y + 72,
        });

        expect(getTargetConnectorCenter(targetNode, 96)).toEqual({
            x: targetNode.x - CONNECTOR_OFFSET,
            y: targetNode.y + 48,
        });
    });

    it('should create a bezier path from the source node to the target node', () => {
        const sourceNode: FlowNode = createTestNode({
            id: 'source',
            x: 100,
            y: 200,
        });

        const targetNode: FlowNode = createTestNode({
            id: 'target',
            x: 500,
            y: 200,
        });

        expect(getEdgePath(sourceNode, targetNode, mocked_edge_bounds)).toMatch(/^M /);
        expect(getEdgePath(sourceNode, targetNode, mocked_edge_bounds)).toContain(' C ');
    });

    it('should anchor edge paths to connector centers', () => {
        const sourceNode: FlowNode = createTestNode({
            id: 'source',
            x: 100,
            y: 200,
        });

        const targetNode: FlowNode = createTestNode({
            id: 'target',
            x: 500,
            y: 260,
        });

        expect(getEdgePath(sourceNode, targetNode, mocked_edge_bounds, 144, 96)).toBe(
            'M 344 272 C 424 272, 408 308, 488 308',
        );
    });

    it('positions the edge label between the source and target nodes', () => {
        const sourceNode = createTestNode({
            id: 'source',
            x: 100,
            y: 200,
        });

        const targetNode = createTestNode({
            id: 'target',
            x: 500,
            y: 200,
        });

        expect(getEdgeLabelPosition(sourceNode, targetNode, mocked_edge_bounds)).toEqual({
            x: 416,
            y: 260,
        });
    });

    it('snaps the edge label to the bezier midpoint when node heights differ', () => {
        const sourceNode = createTestNode({
            id: 'source',
            x: 100,
            y: 200,
        });

        const targetNode = createTestNode({
            id: 'target',
            x: 500,
            y: 260,
        });

        expect(getEdgeLabelPosition(sourceNode, targetNode, mocked_edge_bounds, 144, 96)).toEqual({
            x: 416,
            y: 290,
        });
    });
});