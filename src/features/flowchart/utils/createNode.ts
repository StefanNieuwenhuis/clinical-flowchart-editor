import type {FlowNode, NodeType} from "../model/types.ts";
import {nodeTypes} from "../model/nodeTypes.ts";

export function createNode(params: {
    id: string;
    type: NodeType;
    x: number;
    y: number;
}): FlowNode {
    const definition = nodeTypes[params.type];

    return {
        id: params.id,
        type: params.type,
        title: definition.defaultTitle,
        body: "",
        x: params.x,
        y: params.y,
    };
}