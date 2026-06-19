import { useRef } from "react";

const DRAG_THRESHOLD_PX = 4;

interface UseNodeDragOptions {
    nodeId: string;
    x: number;
    y: number;
    scale: number;
    onMove: (nodeId: string, position: { x: number; y: number }) => void;
    onSelect: (nodeId: string) => void;
}

interface DragState {
    pointerId: number;
    startPointerX: number;
    startPointerY: number;
    startNodeX: number;
    startNodeY: number;
    hasDragged: boolean;
}

export function useNodeDrag({
                                nodeId,
                                x,
                                y,
                                scale,
                                onMove,
                                onSelect,
                            }: UseNodeDragOptions) {
    const dragStateRef = useRef<DragState | null>(null);

    function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
        event.stopPropagation();

        dragStateRef.current = {
            pointerId: event.pointerId,
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startNodeX: x,
            startNodeY: y,
            hasDragged: false,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        document.body.style.userSelect = "none";
    }

    function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
        const dragState = dragStateRef.current;

        if (!dragState || event.pointerId !== dragState.pointerId) {
            return;
        }

        const deltaXScreen = event.clientX - dragState.startPointerX;
        const deltaYScreen = event.clientY - dragState.startPointerY;
        const deltaX = deltaXScreen / scale;
        const deltaY = deltaYScreen / scale;

        // Treat small pointer movement as a click to avoid accidental drags.
        const hasPassedThreshold =
            Math.abs(deltaXScreen) > DRAG_THRESHOLD_PX ||
            Math.abs(deltaYScreen) > DRAG_THRESHOLD_PX;

        if (!hasPassedThreshold) {
            return;
        }

        dragState.hasDragged = true;

        onMove(nodeId, {
            x: dragState.startNodeX + deltaX,
            y: dragState.startNodeY + deltaY,
        });
    }

    function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
        const dragState = dragStateRef.current;

        if (!dragState || event.pointerId !== dragState.pointerId) {
            return;
        }

        dragStateRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        document.body.style.userSelect = "";

        // Select on click, but skip selection when a drag interaction occurred.
        if (!dragState.hasDragged) {
            onSelect(nodeId);
        }
    }

    return {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
    };
}