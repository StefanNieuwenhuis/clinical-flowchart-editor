import type { FlowNode } from "../model/types";

export const NODE_WIDTH = 256;
export const NODE_HEIGHT = 120;
export const GRAPH_PADDING = 80;
export const EDGE_LABEL_PADDING = 400;

export interface GraphBounds {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export function getGraphBounds(nodes: FlowNode[]): GraphBounds {
    if (nodes.length === 0) {
        return {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: 0,
            height: 0,
        };
    }

    const left = Math.min(...nodes.map((node) => node.x)) - GRAPH_PADDING;
    const top = Math.min(...nodes.map((node) => node.y)) - GRAPH_PADDING;
    const right =
        Math.max(...nodes.map((node) => node.x + NODE_WIDTH)) + GRAPH_PADDING;
    const bottom =
        Math.max(...nodes.map((node) => node.y + NODE_HEIGHT)) + GRAPH_PADDING;

    return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
    };
}