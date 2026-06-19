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

function getEdgeControlOffset(start: Point, end: Point): number {
    return Math.max(80, Math.abs(end.x - start.x) / 2);
}

function getEdgeControlPoints(start: Point, end: Point): { controlA: Point; controlB: Point } {
    const controlOffset = getEdgeControlOffset(start, end);

    return {
        controlA: {
            x: start.x + controlOffset,
            y: start.y,
        },
        controlB: {
            x: end.x - controlOffset,
            y: end.y,
        },
    };
}

function getCubicBezierPoint(start: Point, controlA: Point, controlB: Point, end: Point, t: number): Point {
    const inverseT = 1 - t;

    return {
        x: (inverseT ** 3 * start.x)
            + (3 * inverseT ** 2 * t * controlA.x)
            + (3 * inverseT * t ** 2 * controlB.x)
            + (t ** 3 * end.x),
        y: (inverseT ** 3 * start.y)
            + (3 * inverseT ** 2 * t * controlA.y)
            + (3 * inverseT * t ** 2 * controlB.y)
            + (t ** 3 * end.y),
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

    const { controlA, controlB } = getEdgeControlPoints(start, end);

    return `M ${start.x} ${start.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${end.x} ${end.y}`;
}

export function getEdgeLabelPosition(
    from: FlowNode,
    to: FlowNode,
    bounds: GraphBounds,
    fromHeight: number = NODE_HEIGHT,
    toHeight: number = NODE_HEIGHT,
): Point {
    const start = getSourceConnectorCenter(from, fromHeight);
    const end = getTargetConnectorCenter(to, toHeight);
    const { controlA, controlB } = getEdgeControlPoints(start, end);
    const midpoint = getCubicBezierPoint(start, controlA, controlB, end, 0.5);

    return {
        x: midpoint.x - bounds.left,
        y: midpoint.y - bounds.top,
    };
}