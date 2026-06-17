import {type RefObject, useEffect, useRef } from "react";
import type { ViewportState } from "../model/types";
import { clamp } from "../../../shared/utils/clamp.ts";

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;
const ZOOM_SENSITIVITY = 0.0015;

interface UseCanvasPanZoomOptions {
    canvasRef: RefObject<HTMLDivElement | null>;
    viewport: ViewportState;
    setViewport: (viewport: ViewportState) => void;
    clearSelection: () => void;
}

interface PanState {
    pointerId: number;
    startPointerX: number;
    startPointerY: number;
    startViewportX: number;
    startViewportY: number;
}

function isInteractiveTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) {
        return false;
    }

    // Ignore panning when interaction starts from canvas UI or focusable controls.
    return Boolean(
        target.closest(
            [
                "[data-canvas-node]",
                "[data-canvas-ui]",
                "button",
                "input",
                "textarea",
                "select",
                "a",
            ].join(","),
        ),
    );
}

export function useCanvasPanZoom({
                                     canvasRef,
                                     viewport,
                                     setViewport,
                                     clearSelection,
                                 }: UseCanvasPanZoomOptions) {
    const panStateRef = useRef<PanState | null>(null);
    const viewportRef = useRef(viewport);

    useEffect(() => {
        viewportRef.current = viewport;
    }, [viewport]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        function handleWheel(event: WheelEvent) {
            event.preventDefault();

            const canvasElement = event.currentTarget;

            if(!(canvasElement instanceof HTMLDivElement)) {
                return;
            }

            const currentViewport = viewportRef.current;
            const rect = canvasElement.getBoundingClientRect();

            const pointerX = event.clientX - rect.left;
            const pointerY = event.clientY - rect.top;

            // Convert screen coordinates back to world coordinates at the current zoom level.
            const worldX = (pointerX - currentViewport.x) / currentViewport.scale;
            const worldY = (pointerY - currentViewport.y) / currentViewport.scale;

            const nextScale = clamp(
                currentViewport.scale * (1 - event.deltaY * ZOOM_SENSITIVITY),
                MIN_SCALE,
                MAX_SCALE,
            );

            // Recompute translation so the same world point stays under the pointer after zoom.
            setViewport({
                x: pointerX - worldX * nextScale,
                y: pointerY - worldY * nextScale,
                scale: nextScale,
            });
        }

        canvas.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, [canvasRef, setViewport]);

    function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if (isInteractiveTarget(event.target)) {
            return;
        }

        clearSelection();

        panStateRef.current = {
            pointerId: event.pointerId,
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startViewportX: viewport.x,
            startViewportY: viewport.y,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        document.body.style.userSelect = "none";
    }

    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
        const panState = panStateRef.current;

        if (!panState || event.pointerId !== panState.pointerId) {
            return;
        }

        setViewport({
            ...viewport,
            x: panState.startViewportX + event.clientX - panState.startPointerX,
            y: panState.startViewportY + event.clientY - panState.startPointerY,
        });
    }

    function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
        const panState = panStateRef.current;

        if (!panState || event.pointerId !== panState.pointerId) {
            return;
        }

        panStateRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        document.body.style.userSelect = "";
    }

    return {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
    };
}