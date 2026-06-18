import type {FlowNode} from "../../model/types.ts";
import {useRef, type PointerEvent, type ReactNode} from "react";
import {nodeTypes} from "../../model/nodeTypes.ts";
import {useNodeDrag} from "../../hooks/useNodeDrag.ts";
import {canStartConnection} from "../../utils/connectionPolicy.ts";

const CONNECTION_DRAG_THRESHOLD_PX = 4;

interface CanvasNodeProps {
    node: FlowNode;
    selected: boolean;
    scale: number;
    onSelect: (nodeId: string) => void;
    onMove: (nodeId: string, position: {x: number, y: number}) => void;
    onConnectEnd: (nodeId: string, point: { x: number; y: number }) => void;
}

export function CanvasNode({node, scale, selected, onSelect, onMove, onConnectEnd}: CanvasNodeProps): ReactNode {
    const connectionStateRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        hasDragged: boolean;
    } | null>(null);

    const dragHandlers = useNodeDrag({
        nodeId: node.id,
        x: node.x,
        y: node.y,
        scale,
        onMove,
        onSelect,
    });

    function handleConnectPointerDown(event: PointerEvent<HTMLSpanElement>) {
        event.stopPropagation();

        connectionStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            hasDragged: false,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        document.body.style.userSelect = "none";
    }

    function handleConnectPointerMove(event: PointerEvent<HTMLSpanElement>) {
        const connectionState = connectionStateRef.current;

        if (!connectionState || event.pointerId !== connectionState.pointerId) {
            return;
        }

        const deltaX = Math.abs(event.clientX - connectionState.startX);
        const deltaY = Math.abs(event.clientY - connectionState.startY);

        if (deltaX > CONNECTION_DRAG_THRESHOLD_PX || deltaY > CONNECTION_DRAG_THRESHOLD_PX) {
            connectionState.hasDragged = true;
        }
    }

    function handleConnectPointerUp(event: PointerEvent<HTMLSpanElement>) {
        const connectionState = connectionStateRef.current;

        if (!connectionState || event.pointerId !== connectionState.pointerId) {
            return;
        }

        connectionStateRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        document.body.style.userSelect = "";

        if (connectionState.hasDragged) {
            onConnectEnd(node.id, {
                x: event.clientX,
                y: event.clientY,
            });
        }
    }

    const showConnectHandle = canStartConnection(node.type);

    return (
        <button
            type="button"
            data-canvas-node
            {...dragHandlers}
            className={[
                "pointer-events-auto absolute z-10 w-64 rounded-xl border bg-white p-4 text-left shadow-sm transition relative",
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

            {showConnectHandle ? (
                <span
                    data-connect-handle
                    title="Verbind naar een volgende stap"
                    className="absolute right-3 top-1/2 size-3 -translate-y-1/2 rounded-full border border-blue-300 bg-blue-50 opacity-80 shadow-sm transition hover:scale-110 hover:opacity-100"
                    onPointerDown={handleConnectPointerDown}
                    onPointerMove={handleConnectPointerMove}
                    onPointerUp={handleConnectPointerUp}
                    onPointerCancel={handleConnectPointerUp}
                />
            ) : null}

            {node.body ? (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                    {node.body}
                </p>
            ) : null}
        </button>
    )
}