import {describe, expect, it} from 'vitest';
import {getEdgeLabelPosition, getEdgePath, getNodeCenter} from "./edgeGeometry.ts";
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
        type: 'question',
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

        const expected_x = ((sourceNode.x + NODE_WIDTH / 2) + (targetNode.x + NODE_WIDTH / 2)) / 2 - mocked_edge_bounds.left;
        const expected_y = ((sourceNode.y + NODE_HEIGHT / 2) + (targetNode.y + NODE_HEIGHT / 2)) / 2 - mocked_edge_bounds.top - 10;

        expect(getEdgeLabelPosition(sourceNode, targetNode, mocked_edge_bounds)).toEqual({
            x: expected_x,
            y: expected_y
        });
    });
});