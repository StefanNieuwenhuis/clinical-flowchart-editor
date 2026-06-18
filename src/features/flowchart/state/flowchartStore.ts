import {create, type StoreApi, type UseBoundStore} from "zustand";
import { initialFlowchart } from "../model/initialFlowchart";
import type {FlowchartDocument, FlowEdge, FlowNode, NodeType, Noop, RouteLabel, ViewportState} from "../model/types";
import {createId} from "../../../shared/utils/ids.ts";
import {createNode} from "../utils/createNode.ts";
import {canConnectNodes} from "../utils/connectionPolicy.ts";

export interface FlowchartState {
    document: FlowchartDocument;
    saveDocument: Noop;
    exportDocument: () => string;
    addNodeOfTypeAt: (type: NodeType, position: {x: number; y: number;}) => void;
    addEdge: (from: string, to: string, label?: RouteLabel) => boolean;
    selectNode: (nodeId: string) => void;
    updateNode: (nodeId: string, patch: Partial<FlowNode>) => void;
    moveNode: (nodeId: string, position: {x: number, y: number}) => void;

    clearSelection: () => void;

    setViewport: (viewport: ViewportState) => void;
    resetViewport: Noop;
    fitViewportToBounds: (options: {
        bounds: {left: number, top: number; width: number, height: number};
        viewportWidth: number;
        viewportHeight: number;
    }) => void;
}

function bumpPatchVersion(version: string): string {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!match) {
        return version;
    }

    const [, major, minor, patch] = match;

    return `${major}.${minor}.${Number(patch) + 1}`;
}

export const useFlowchartStore: UseBoundStore<StoreApi<FlowchartState>> = create<FlowchartState>((set) => ({
    document: initialFlowchart,

    saveDocument: () => {
        set((state) => ({
            document: {
                ...state.document,
                version: bumpPatchVersion(state.document.version),
            },
        }));
    },

    exportDocument: () => JSON.stringify(useFlowchartStore.getState().document),

    addNodeOfTypeAt: (type, position) => {
        set((state) => {
            const id = createId(type);

            const node = createNode({
                id,
                type,
                x: position.x,
                y: position.y,
            });

            return {
                document: {
                    ...state.document,
                    selectedNodeId: node.id,
                    nodes: [...state.document.nodes, node],
                },
            };
        });
    },
    addEdge: (from, to, label = "") => {
        const state = useFlowchartStore.getState();
        const sourceNode = state.document.nodes.find((node) => node.id === from);
        const targetNode = state.document.nodes.find((node) => node.id === to);

        if (!sourceNode || !targetNode || !canConnectNodes(sourceNode.type, targetNode.type)) {
            return false;
        }

        const edge: FlowEdge = {
            id: createId("edge"),
            from,
            to,
            label,
        };

        set((currentState) => ({
            document: {
                ...currentState.document,
                edges: [...currentState.document.edges, edge],
            },
        }));

        return true;
    },
    selectNode: (nodeId: string): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                selectedNodeId: nodeId,
            },
        }));
    },

    clearSelection: (): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                selectedNodeId: null,
            },
        }));
    },

    updateNode: (nodeId: string, patch: Partial<FlowNode>): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                nodes: state.document.nodes.map((node: FlowNode): FlowNode =>
                    node.id === nodeId ? { ...node, ...patch } : node,
                ),
            },
        }));
    },

    moveNode: (nodeId: string, position: {x: number, y: number}): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                nodes: state.document.nodes.map((node: FlowNode): FlowNode =>
                    node.id === nodeId
                        ? {
                            ...node,
                            x: position.x,
                            y: position.y,
                        }
                        : node,
                ),
            },
        }));
    },

    setViewport: (viewport: ViewportState): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                viewport,
            },
        }));
    },



    resetViewport: () => {
        set((state) => ({
            document: {
                ...state.document,
                viewport: {
                    x: 0,
                    y: 0,
                    scale: 1,
                },
            },
        }));
    },

    fitViewportToBounds: ({ bounds, viewportWidth, viewportHeight }) => {
        // Fit bounds into the viewport while preventing zoom-in beyond 1:1.
        const scale = Math.min(
            viewportWidth / bounds.width,
            viewportHeight / bounds.height,
            1,
        );

        // Center the scaled bounds within the viewport.
        const x = (viewportWidth - bounds.width * scale) / 2 - bounds.left * scale;
        const y = (viewportHeight - bounds.height * scale) / 2 - bounds.top * scale;

        set((state) => ({
            document: {
                ...state.document,
                viewport: {
                    x,
                    y,
                    scale,
                },
            },
        }));
    },
}));