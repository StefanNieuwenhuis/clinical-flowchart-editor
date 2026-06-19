import type {FlowNode} from "../model/types.ts";
import {type GraphBounds, NODE_HEIGHT, NODE_WIDTH} from "./graphBounds.ts";

export type Point = {
    x: number;
    y: number;
};

export const CONNECTOR_OFFSET = 12;


export function getNodeCenter(node: FlowNode): Point {
    return {
        x: node.x + NODE_WIDTH / 2,
        y: node.y + NODE_HEIGHT / 2,
    };
}

export function getSourceConnectorCenter(node: FlowNode, nodeHeight: number = NODE_HEIGHT): Point {
    return {
        x: node.x + NODE_WIDTH - CONNECTOR_OFFSET,
        y: node.y + nodeHeight / 2,
    };
}

export function getTargetConnectorCenter(node: FlowNode, nodeHeight: number = NODE_HEIGHT): Point {
    return {
        x: node.x - CONNECTOR_OFFSET,
        y: node.y + nodeHeight / 2,
    };
}

export function getEdgePath(
    from: FlowNode,
    to: FlowNode,
    bounds: GraphBounds,
    fromHeight: number = NODE_HEIGHT,
    toHeight: number = NODE_HEIGHT,
) {
    const sourceCenter = getSourceConnectorCenter(from, fromHeight);
    const targetCenter = getTargetConnectorCenter(to, toHeight);

    const start = {
        x: sourceCenter.x - bounds.left,
        y: sourceCenter.y - bounds.top,
    };

    const end = {
        x: targetCenter.x - bounds.left,
        y: targetCenter.y - bounds.top,
    };

    const controlOffset = Math.max(80, Math.abs(end.x - start.x) / 2);

    return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${
        end.x - controlOffset
    } ${end.y}, ${end.x} ${end.y}`;
}

export function getEdgeLabelPosition(from: FlowNode, to: FlowNode, bounds: GraphBounds): Point {
    const fromCenter:Point = getNodeCenter(from);
    const toCenter: Point = getNodeCenter(to);

    return {
        x: (fromCenter.x + toCenter.x) / 2 - bounds.left,
        y: (fromCenter.y + toCenter.y) / 2 - bounds.top - 10,
    };
}