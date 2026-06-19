import type {FlowNode} from "../../model/types.ts";
import type {MouseEvent, ReactNode, PointerEvent} from "react";
import {nodeTypes} from "../../model/nodeTypes.ts";
import {useNodeDrag} from "../../hooks/useNodeDrag.ts";

interface CanvasNodeProps {
    node: FlowNode;
    selected: boolean;
    scale: number;
    onSelect: (nodeId: string) => void;
    onMove: (nodeId: string, position: {x: number, y: number}) => void;
    connectMode?: boolean;
    isConnectSource?: boolean;
    isConnectTargetBlocked?: boolean;
    onStartConnect?: (nodeId: string) => void;
    onCancelConnect?: () => void;
    onCompleteConnect?: (nodeId: string) => void;
    onBlockedConnectAttempt?: (nodeId: string) => void;
    onSourceConnectorPointerDown?: (nodeId: string, event: PointerEvent<HTMLDivElement>) => void;
    onTargetConnectorPointerUp?: (nodeId: string, event: PointerEvent<HTMLDivElement>) => void;
    onTargetConnectorPointerEnter?: (nodeId: string) => void;
    onTargetConnectorPointerLeave?: () => void;
    hoveredTargetNodeId?: string | null;
}

export function CanvasNode({
    node,
    scale,
    selected,
    onSelect,
    onMove,
    connectMode = false,
    isConnectSource = false,
    isConnectTargetBlocked = false,
    onStartConnect,
    onCancelConnect,
    onCompleteConnect,
    onBlockedConnectAttempt,
    onSourceConnectorPointerDown,
    onTargetConnectorPointerUp,
    onTargetConnectorPointerEnter,
    onTargetConnectorPointerLeave,
    hoveredTargetNodeId,
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
    const isStartNode = node.type === 'start';
    const canStartConnection = !isEndNode;
    const canAcceptConnection = !isStartNode;
    const isHoveredTarget = hoveredTargetNodeId === node.id;
    const sourceConnectorLabel = `Verbinding starten van ${node.title}`;
    const targetConnectorLabel = `Verbinding voltooien bij ${node.title}`;

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        if (!connectMode) {
            return;
        }

        event.stopPropagation();

        if (isConnectSource) {
            onCancelConnect?.();
            return;
        }

        if (isConnectTargetBlocked) {
            onBlockedConnectAttempt?.(node.id);
            return;
        }

        onCompleteConnect?.(node.id);
    }

    function handleSourceConnectorPointerDown(event: PointerEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();
        onSourceConnectorPointerDown?.(node.id, event);
    }

    function handleTargetConnectorPointerUp(event: PointerEvent<HTMLDivElement>) {
        event.preventDefault();
        event.stopPropagation();
        onTargetConnectorPointerUp?.(node.id, event);
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
                                ? isConnectTargetBlocked
                                    ? "border-rose-300 cursor-not-allowed hover:border-rose-400 hover:ring-2 hover:ring-rose-100"
                                    : "border-slate-300 cursor-pointer hover:border-emerald-500 hover:ring-2 hover:ring-emerald-100"
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

                {canStartConnection && (
                    <div
                        data-canvas-ui
                        data-connector="source"
                        onPointerDown={handleSourceConnectorPointerDown}
                        className={[
                            "pointer-events-auto absolute -right-3 top-1/2 z-20 h-6 w-6 -translate-y-1/2 rounded-full border-2 transition cursor-grab active:cursor-grabbing",
                            isConnectSource
                                ? "border-blue-600 bg-blue-50 shadow-md"
                                : connectMode
                                    ? "border-blue-400 bg-blue-100 shadow-sm"
                                    : "border-slate-300 bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50",
                        ].join(' ')}
                        title={sourceConnectorLabel}
                    />
                )}

                {canAcceptConnection && (
                    <div
                        data-canvas-ui
                        data-connector="target"
                        onPointerUp={handleTargetConnectorPointerUp}
                        onPointerEnter={() => onTargetConnectorPointerEnter?.(node.id)}
                        onPointerLeave={() => onTargetConnectorPointerLeave?.()}
                        className={[
                            "pointer-events-auto absolute -left-3 top-1/2 z-20 h-6 w-6 -translate-y-1/2 rounded-full border-2 transition",
                            !connectMode
                                ? "border-slate-300 bg-white"
                                : isConnectTargetBlocked
                                    ? "border-rose-300 bg-rose-50 cursor-not-allowed"
                                    : isHoveredTarget
                                        ? "border-emerald-600 bg-emerald-100 shadow-md ring-2 ring-emerald-200"
                                        : "border-emerald-400 bg-emerald-50 shadow-sm",
                        ].join(' ')}
                        title={targetConnectorLabel}
                    />
                )}
            </div>
        </div>
    );
}
