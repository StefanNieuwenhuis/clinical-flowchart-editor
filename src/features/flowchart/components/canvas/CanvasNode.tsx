import type {FlowNode} from "../../model/types.ts";
import type {ReactNode} from "react";
import {nodeTypes} from "../../model/nodeTypes.ts";
import {useNodeDrag} from "../../hooks/useNodeDrag.ts";

interface CanvasNodeProps {
    node: FlowNode;
    selected: boolean;
    scale: number;
    onSelect: (nodeId: string) => void;
    onMove: (nodeId: string, position: {x: number, y: number}) => void;
}

export function CanvasNode({node, scale, selected, onSelect, onMove}: CanvasNodeProps): ReactNode {
    const dragHandlers = useNodeDrag({
        nodeId: node.id,
        x: node.x,
        y: node.y,
        scale,
        onMove,
        onSelect,
    });

    return (
        <button
            type="button"
            data-canvas-node
            {...dragHandlers}
            className={[
                "pointer-events-auto absolute z-10 w-64 rounded-xl border bg-white p-4 text-left shadow-sm transition",
                selected
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md",
            ].join(" ")}
            style={{
                left: node.x,
                top: node.y,
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {nodeTypes[node.type].label}
                    </div>

                    <div className="mt-1 text-sm font-semibold leading-snug text-slate-950">
                        {node.title}
                    </div>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {node.type}
                </span>
            </div>

            {node.body ? (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                    {node.body}
                </p>
            ) : null}
        </button>
    )
}