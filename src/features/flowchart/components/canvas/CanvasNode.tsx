import type {FlowNode} from "../../model/types.ts";
import type {MouseEvent, ReactNode} from "react";
import {nodeTypes} from "../../model/nodeTypes.ts";
import {useNodeDrag} from "../../hooks/useNodeDrag.ts";
import {Link2} from "lucide-react";

interface CanvasNodeProps {
    node: FlowNode;
    selected: boolean;
    scale: number;
    onSelect: (nodeId: string) => void;
    onMove: (nodeId: string, position: {x: number, y: number}) => void;
    connectMode?: boolean;
    isConnectSource?: boolean;
    onStartConnect?: (nodeId: string) => void;
    onCancelConnect?: () => void;
    onCompleteConnect?: (nodeId: string) => void;
}

export function CanvasNode({
    node,
    scale,
    selected,
    onSelect,
    onMove,
    connectMode = false,
    isConnectSource = false,
    onStartConnect,
    onCancelConnect,
    onCompleteConnect,
}: CanvasNodeProps): ReactNode {
    const dragHandlers = useNodeDrag({
        nodeId: node.id,
        x: node.x,
        y: node.y,
        scale,
        onMove,
        onSelect,
    });

    const isEndNode = node.type === 'end';
    const connectButtonLabel = isConnectSource
        ? `Annuleer verbinding vanaf ${node.title}`
        : `Start verbinding vanaf ${node.title}`;

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        if (!connectMode) {
            return;
        }

        event.stopPropagation();

        if (isConnectSource) {
            onCancelConnect?.();
            return;
        }

        onCompleteConnect?.(node.id);
    }

    return (
        <div
            className="pointer-events-none absolute z-10"
            style={{ left: node.x, top: node.y }}
        >
            <div className="relative">
                <button
                    type="button"
                    data-canvas-node
                    {...dragHandlers}
                    onClick={handleClick}
                    className={[
                        "pointer-events-auto w-64 rounded-xl border bg-white p-4 text-left shadow-sm transition",
                        isConnectSource
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : connectMode
                                ? "border-slate-300 cursor-pointer hover:border-emerald-500 hover:ring-2 hover:ring-emerald-100"
                                : selected
                                    ? "border-blue-500 ring-2 ring-blue-100"
                                    : "border-slate-200 hover:border-slate-300 hover:shadow-md",
                    ].join(" ")}
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

                {!isEndNode && (
                    <button
                        type="button"
                        data-canvas-ui
                        aria-label={connectButtonLabel}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();

                            if (connectMode && isConnectSource) {
                                onCancelConnect?.();
                                return;
                            }

                            onStartConnect?.(node.id);
                        }}
                        className={[
                            "pointer-events-auto absolute -right-4 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-sm transition",
                            isConnectSource
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-300 hover:border-blue-400 hover:bg-blue-50",
                        ].join(' ')}
                        title={connectButtonLabel}
                    >
                        <Link2 className="h-3 w-3 text-slate-500" />
                    </button>
                )}
            </div>
        </div>
    );
}
