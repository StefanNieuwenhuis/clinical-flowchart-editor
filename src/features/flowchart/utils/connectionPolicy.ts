import {nodeTypes} from "../model/nodeTypes.ts";
import type {NodeType} from "../model/types.ts";

export function canStartConnection(nodeType: NodeType): boolean {
    return nodeType === "start" || !nodeTypes[nodeType].terminal;
}

export function canAcceptConnection(nodeType: NodeType): boolean {
    return nodeType !== "start";
}

export function canConnectNodes(sourceType: NodeType, targetType: NodeType): boolean {
    return canStartConnection(sourceType) && canAcceptConnection(targetType);
}