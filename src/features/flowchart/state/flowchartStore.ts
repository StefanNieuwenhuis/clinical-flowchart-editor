import {create, type StoreApi, type UseBoundStore} from "zustand";
import type {FlowchartDocument, FlowEdge, FlowNode, NodeType, Noop, ViewportState} from "../model/types";
import {createId} from "../../../shared/utils/ids.ts";
import {createNode} from "../utils/createNode.ts";
import {loadFromStorage, saveToStorage} from "../utils/flowchartStorage.ts";

export interface FlowchartState {
    document: FlowchartDocument;
    isDirty: boolean;
    saveDocument: Noop;
    exportDocument: () => string;
    addNodeOfTypeAt: (type: NodeType, position: {x: number; y: number;}) => void;
    deleteNode: (nodeId: string) => void;
    deleteEdge: (edgeId: string) => void;
    connectNodes: (fromNodeId: string, toNodeId: string) => void;
    updateEdge: (edgeId: string, patch: Partial<FlowEdge>) => void;
    selectNode: (nodeId: string) => void;
    selectEdge: (edgeId: string) => void;
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

const AUTO_SAVE_DELAY_MS = 500;

export const useFlowchartStore: UseBoundStore<StoreApi<FlowchartState>> = create<FlowchartState>((set) => ({
    document: loadFromStorage(),
    isDirty: false,

    saveDocument: () => {
        set((state) => {
            const newDocument = {
                ...state.document,
                version: bumpPatchVersion(state.document.version),
            };
            saveToStorage(newDocument);
            return {
                document: newDocument,
                isDirty: false,
            };
        });
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
                isDirty: true,
            };
        });
    },

    deleteNode: (nodeId: string): void => {
        set((state: FlowchartState) => {
            const nodeExists = state.document.nodes.some((node) => node.id === nodeId);

            if (!nodeExists) {
                return state;
            }

            return {
                document: {
                    ...state.document,
                    nodes: state.document.nodes.filter((node) => node.id !== nodeId),
                    edges: state.document.edges.filter(
                        (edge) => edge.from !== nodeId && edge.to !== nodeId,
                    ),
                    selectedNodeId:
                        state.document.selectedNodeId === nodeId
                            ? null
                            : state.document.selectedNodeId,
                    selectedEdgeId:
                        state.document.selectedEdgeId !== null
                        && state.document.edges.some(
                            (edge) => edge.id === state.document.selectedEdgeId
                                && (edge.from === nodeId || edge.to === nodeId),
                        )
                            ? null
                            : state.document.selectedEdgeId,
                },
                isDirty: true,
            };
        });
    },

    deleteEdge: (edgeId: string): void => {
        set((state: FlowchartState) => {
            const edgeExists = state.document.edges.some((edge) => edge.id === edgeId);

            if (!edgeExists) {
                return state;
            }

            return {
                document: {
                    ...state.document,
                    edges: state.document.edges.filter((edge) => edge.id !== edgeId),
                    selectedEdgeId:
                        state.document.selectedEdgeId === edgeId
                            ? null
                            : state.document.selectedEdgeId,
                },
                isDirty: true,
            };
        });
    },

    connectNodes: (fromNodeId, toNodeId) => {
        set((state) => {
            const fromNode = state.document.nodes.find((node) => node.id === fromNodeId);
            const toNode = state.document.nodes.find((node) => node.id === toNodeId);

            if (!fromNode || !toNode) {
                return state;
            }

            if (fromNode.type === "end") {
                return state;
            }

            if (toNode.type === "start") {
                return state;
            }

            const hasDuplicateConnection = state.document.edges.some(
                (edge) => edge.from === fromNodeId && edge.to === toNodeId,
            );

            if (hasDuplicateConnection) {
                return state;
            }

            const edge: FlowEdge = {
                id: createId("edge"),
                from: fromNodeId,
                to: toNodeId,
                label: fromNode.type === "start" ? "" : "",
            };

            return {
                document: {
                    ...state.document,
                    edges: [...state.document.edges, edge],
                },
                isDirty: true,
            };
        });
    },

    updateEdge: (edgeId: string, patch: Partial<FlowEdge>): void => {
        set((state: FlowchartState) => {
            const edgeToUpdate = state.document.edges.find((edge) => edge.id === edgeId);
            
            if (!edgeToUpdate) {
                return state;
            }

            const fromNode = state.document.nodes.find((node) => node.id === edgeToUpdate.from);
            
            if (!fromNode) {
                return state;
            }

            const updatedPatch = { ...patch };
            
            if (fromNode.type === "start" && patch.label !== undefined && patch.label !== "") {
                updatedPatch.label = "";
            }

            return {
                document: {
                    ...state.document,
                    edges: state.document.edges.map((edge: FlowEdge): FlowEdge =>
                        edge.id === edgeId ? { ...edge, ...updatedPatch } : edge,
                    ),
                },
                isDirty: true,
            };
        });
    },

    selectNode: (nodeId: string): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                selectedNodeId: nodeId,
                selectedEdgeId: null,
            },
        }));
    },

    selectEdge: (edgeId: string): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                selectedNodeId: null,
                selectedEdgeId: edgeId,
            },
        }));
    },

    clearSelection: (): void => {
        set((state: FlowchartState) => ({
            document: {
                ...state.document,
                selectedNodeId: null,
                selectedEdgeId: null,
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
            isDirty: true,
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
            isDirty: true,
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

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

useFlowchartStore.subscribe((state, prevState) => {
    if (state.document === prevState.document) return;
    if (autoSaveTimer !== null) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveToStorage(state.document);
    }, AUTO_SAVE_DELAY_MS);
});
