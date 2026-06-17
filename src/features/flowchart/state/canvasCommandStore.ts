import { create } from "zustand";
import type { NodeType } from "../model/types";

interface CanvasCommandState {
    addNodeAtViewportCenter: ((type: NodeType) => void) | null;
    setAddNodeAtViewportCenter: (
        handler: ((type: NodeType) => void) | null,
    ) => void;
}

export const useCanvasCommandStore = create<CanvasCommandState>((set) => ({
    addNodeAtViewportCenter: null,

    setAddNodeAtViewportCenter: (handler) => {
        set({
            addNodeAtViewportCenter: handler,
        });
    },
}));