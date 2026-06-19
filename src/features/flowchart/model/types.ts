export type Noop = () => void;

export type NodeType = "start" | "decision" | "process" | "end";

export type FlowchartStatus = "Concept" | "Review" | "Goedgekeurd";

export type RouteLabel = "Start" | "Ja" | "Nee" | "";

export interface FlowNode {
    id: string;
    type: NodeType;
    title: string;
    body: string;
    x: number;
    y: number;
    color?: string;
    tags?: string[];
}

export interface FlowEdge {
    id: string;
    from: string;
    to: string;
    label: RouteLabel;
}

export interface ViewportState {
    x: number;
    y: number;
    scale: number;
}

export interface FlowchartDocument {
    title: string;
    version: string;
    status: FlowchartStatus;
    nodes: FlowNode[];
    edges: FlowEdge[];
    selectedNodeId: string | null;
    viewport: ViewportState;
}