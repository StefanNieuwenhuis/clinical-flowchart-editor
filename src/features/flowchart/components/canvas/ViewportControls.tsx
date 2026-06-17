import type {Noop} from "../../model/types.ts";
import type {ReactNode} from "react";
import {Plus, Maximize2, Minus, RotateCcw} from "lucide-react";

interface ViewportControlsProps {
    scale: number;
    onZoomIn: Noop;
    onZoomOut: Noop;
    onReset: Noop;
    onFit: Noop;
}

export function ViewportControls({
    scale,
    onZoomIn,
    onZoomOut,
    onReset,
    onFit,
}: ViewportControlsProps): ReactNode {
    return (
        <div
            data-canvas-ui
            onPointerDown={(event) => event.stopPropagation()}
            className="absolute left-4 top-4 z-20 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs text-slate-500 shadow-sm"
        >
            <button
                type="button"
                onClick={onZoomOut}
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Zoom uit"
            >
                <Minus className="size-4" />
            </button>

            <div className="min-w-12 text-center tabular-nums">
                {Math.round(scale * 100)}%
            </div>

            <button
                type="button"
                onClick={onZoomIn}
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Zoom in"
            >
                <Plus className="size-4" />
            </button>

            <div className="mx-1 h-5 w-px bg-slate-200" />

            <button
                type="button"
                onClick={onFit}
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Pas in beeld"
            >
                <Maximize2 className="size-4" />
            </button>

            <button
                type="button"
                onClick={onReset}
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
                aria-label="Reset weergave"
            >
                <RotateCcw className="size-4" />
            </button>
        </div>
    );
}