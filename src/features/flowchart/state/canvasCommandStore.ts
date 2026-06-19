import { create } from "zustand";
import type { NodeType } from "../model/types";

interface CanvasCommandState {
    addNodeAtViewportCenter: ((type: NodeType) => void) | null;
    focusTitleRequestId: number;
    setAddNodeAtViewportCenter: (
        handler: ((type: NodeType) => void) | null,
    ) => void;
    requestTitleFocus: () => void;
}

export const useCanvasCommandStore = create<CanvasCommandState>((set) => ({
    addNodeAtViewportCenter: null,
    focusTitleRequestId: 0,

    setAddNodeAtViewportCenter: (handler) => {
        set({
            addNodeAtViewportCenter: handler,
        });
    },

    requestTitleFocus: () => {
        set((state) => ({
            focusTitleRequestId: state.focusTitleRequestId + 1,
        }));
    },
}));