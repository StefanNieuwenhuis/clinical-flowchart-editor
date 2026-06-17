import {describe, expect, it} from 'vitest';
import {getGraphBounds, GRAPH_PADDING, NODE_HEIGHT, NODE_WIDTH} from "./graphBounds.ts";
import type {FlowNode} from "../model/types.ts";

const mock_zero_bounds = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
};

describe('graphBounds', () => {
    it('should return zero bounds for an empty node list', () => {
        expect(getGraphBounds([])).toEqual(mock_zero_bounds);
    });

    it('should return padded bounds for a single node', () => {
        const nodes: FlowNode[] = [
            {
                id: 'node-1',
                type: 'question',
                title: 'Question',
                body: '',
                x: 100,
                y: 200,
            },
        ];
        expect(getGraphBounds(nodes)).toEqual({
            left: 100 - GRAPH_PADDING,
            top: 200 - GRAPH_PADDING,
            right: 100 + NODE_WIDTH + GRAPH_PADDING,
            bottom: 200 + NODE_HEIGHT + GRAPH_PADDING,
            width: NODE_WIDTH + GRAPH_PADDING * 2,
            height: NODE_HEIGHT + GRAPH_PADDING * 2,
        });
    });

    it('returns padded bounds for multiple nodes', () => {
        const nodes: FlowNode[] = [
            {
                id: 'node-1',
                type: 'question',
                title: 'Question 1',
                body: '',
                x: 100,
                y: 200,
            },
            {
                id: 'node-2',
                type: 'consult_nurse',
                title: 'Consult Nurse',
                body: '',
                x: 500,
                y: 600,
            },
        ];

        expect(getGraphBounds(nodes)).toEqual({
            left: 100 - GRAPH_PADDING,
            top: 200 - GRAPH_PADDING,
            right: 500 + NODE_WIDTH + GRAPH_PADDING,
            bottom: 600 + NODE_HEIGHT + GRAPH_PADDING,
            width: 500 + NODE_WIDTH + GRAPH_PADDING - (100 - GRAPH_PADDING),
            height: 600 + NODE_HEIGHT + GRAPH_PADDING - (200 - GRAPH_PADDING),
        });
    });
});