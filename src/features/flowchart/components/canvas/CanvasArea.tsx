import {type ReactNode, type RefObject, useEffect, useRef, useState} from "react";
import {type FlowchartState, useFlowchartStore} from "../../state/flowchartStore.ts";
import type {FlowEdge, FlowNode, NodeType, Noop, ViewportState} from "../../model/types.ts";
import {EdgeLayer} from "./EdgeLayer.tsx";
import {CanvasNode} from "./CanvasNode.tsx";
import {useCanvasPanZoom} from "../../hooks/useCanvasPanZoom.ts";
import {getGraphBounds, NODE_HEIGHT, NODE_WIDTH} from "../../utils/graphBounds.ts";
import {ViewportControls} from "./ViewportControls.tsx";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";
import {getViewportCenterInWorld} from "../../utils/viewportMath.ts";
import {clamp} from "../../../../shared/utils/clamp.ts";

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;
const PREVIEW_PADDING = 80;
const PREVIEW_DASH = '6 6';

type Point = { x: number; y: number };

export function CanvasArea(): ReactNode {
    const canvasRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const nodes: FlowNode[] = useFlowchartStore((state: FlowchartState): FlowNode[] => state.document.nodes);
    const edges: FlowEdge[] = useFlowchartStore((state: FlowchartState): FlowEdge[] => state.document.edges);
    const selectedNodeId: string | null = useFlowchartStore((state: FlowchartState): string | null => state.document.selectedNodeId);
    const viewport: ViewportState = useFlowchartStore((state: FlowchartState): ViewportState => state.document.viewport);

    const addNodeOfTypeAt = useFlowchartStore((state: FlowchartState) => state.addNodeOfTypeAt);
    const setAddNodeAtViewportCenter = useCanvasCommandStore(
        (state) => state.setAddNodeAtViewportCenter,
    );
    const selectNode: (nodeId: string) => void = useFlowchartStore((state: FlowchartState): (nodeId: string) => void => state.selectNode);
    const clearSelection: Noop = useFlowchartStore((state: FlowchartState): () => void => state.clearSelection);
    const connectNodes = useFlowchartStore((state: FlowchartState) => state.connectNodes);
    const moveNode: (nodeId: string, position: {x: number, y:number}) => void = useFlowchartStore((state: FlowchartState): (nodeId: string, position: {x: number, y:number}) => void => state.moveNode);

    const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);
    const [previewCursorWorld, setPreviewCursorWorld] = useState<Point | null>(null);

    const pendingSourceNode = pendingSourceId
        ? nodes.find((node) => node.id === pendingSourceId) ?? null
        : null;

    const setViewport: (viewport: ViewportState) => void = useFlowchartStore((state: FlowchartState): (viewport: ViewportState)=> void => state.setViewport);
    const resetViewport: Noop = useFlowchartStore((state: FlowchartState): Noop => state.resetViewport);
    const fitViewportToBounds = useFlowchartStore((state: FlowchartState) => state.fitViewportToBounds);

    const panZoomHandlers = useCanvasPanZoom({
        canvasRef,
        viewport,
        setViewport,
        clearSelection: () => {
            clearSelection();
            setPendingSourceId(null);
            setPreviewCursorWorld(null);
        },
    });

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setPendingSourceId(null);
                setPreviewCursorWorld(null);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    function toWorldPoint(event: React.PointerEvent<HTMLDivElement>): Point | null {
        const canvas = canvasRef.current;

        if (!canvas) {
            return null;
        }

        const rect = canvas.getBoundingClientRect();

        return {
            x: (event.clientX - rect.left - viewport.x) / viewport.scale,
            y: (event.clientY - rect.top - viewport.y) / viewport.scale,
        };
    }

    function handleStartConnect(nodeId: string) {
        const sourceNode = nodes.find((node) => node.id === nodeId);

        setPendingSourceId(nodeId);

        if (!sourceNode) {
            setPreviewCursorWorld(null);
            return;
        }

        setPreviewCursorWorld({
            x: sourceNode.x + NODE_WIDTH,
            y: sourceNode.y + NODE_HEIGHT / 2,
        });
    }

    function handleCompleteConnect(targetNodeId: string) {
        if (pendingSourceId !== null) {
            connectNodes(pendingSourceId, targetNodeId);
        }
        setPendingSourceId(null);
        setPreviewCursorWorld(null);
    }

    function handleCancelConnect() {
        setPendingSourceId(null);
        setPreviewCursorWorld(null);
    }

    function handleCanvasPointerMoveCapture(event: React.PointerEvent<HTMLDivElement>) {
        if (pendingSourceNode === null) {
            return;
        }

        const target = event.target;

        if (target instanceof Element && target.closest('[data-canvas-ui]')) {
            return;
        }

        const worldPoint = toWorldPoint(event);

        if (!worldPoint) {
            return;
        }

        setPreviewCursorWorld(worldPoint);
    }

    function handleCanvasPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
        if (pendingSourceId === null) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        if (target.closest('[data-canvas-node], [data-canvas-ui]')) {
            return;
        }

        event.stopPropagation();
        setPendingSourceId(null);
        setPreviewCursorWorld(null);
    }

    useEffect(() => {
        function addNodeAtViewportCenter(type: NodeType) {
            const canvas = canvasRef.current;

            if (!canvas) {
                return;
            }

            const position = getViewportCenterInWorld({
                canvasWidth: canvas.clientWidth,
                canvasHeight: canvas.clientHeight,
                viewport,
            });

            addNodeOfTypeAt(type, position);
        }

        setAddNodeAtViewportCenter(addNodeAtViewportCenter);

        return () => {
            setAddNodeAtViewportCenter(null);
        };
    }, [addNodeOfTypeAt, setAddNodeAtViewportCenter, viewport]);

    function handleZoomTo(nextScale: number) {
        setViewport({
            ...viewport,
            scale: clamp(nextScale, MIN_SCALE, MAX_SCALE),
        });
    }

    function handleFitToScreen() {
        const canvas = canvasRef.current;

        if(!canvas) { return; }

        const bounds = getGraphBounds(nodes);

        fitViewportToBounds({
            bounds,
            viewportWidth: canvas.clientWidth,
            viewportHeight: canvas.clientHeight,
        });

    }

    const previewEdge = pendingSourceNode && previewCursorWorld
        ? (() => {
            const start = {
                x: pendingSourceNode.x + NODE_WIDTH,
                y: pendingSourceNode.y + NODE_HEIGHT / 2,
            };

            const end = previewCursorWorld;

            const left = Math.min(start.x, end.x) - PREVIEW_PADDING;
            const top = Math.min(start.y, end.y) - PREVIEW_PADDING;
            const right = Math.max(start.x, end.x) + PREVIEW_PADDING;
            const bottom = Math.max(start.y, end.y) + PREVIEW_PADDING;

            const width = right - left;
            const height = bottom - top;

            const startX = start.x - left;
            const startY = start.y - top;
            const endX = end.x - left;
            const endY = end.y - top;

            const controlOffset = Math.max(PREVIEW_PADDING, Math.abs(endX - startX) / 2);

            return {
                left,
                top,
                width,
                height,
                d: `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`,
            };
        })()
        : null;

    return (
        <div
            ref={canvasRef}
            {...panZoomHandlers}
            onPointerMoveCapture={handleCanvasPointerMoveCapture}
            onPointerDownCapture={handleCanvasPointerDownCapture}
            className={[
                'relative h-full w-full overflow-hidden bg-slate-50',
                pendingSourceId === null ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
            ].join(' ')}
        >
            <ViewportControls
                scale={viewport.scale}
                onZoomIn={() => handleZoomTo(viewport.scale + 0.1)}
                onZoomOut={() => handleZoomTo(viewport.scale - 0.1)}
                onReset={resetViewport} onFit={handleFitToScreen}
            />

            {pendingSourceNode && (
                <div
                    data-canvas-ui
                    className="pointer-events-auto absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm"
                >
                    <span className="font-medium">
                        Verbinding maken vanaf: {pendingSourceNode.title}
                    </span>

                    <button
                        type="button"
                        data-canvas-ui
                        onClick={handleCancelConnect}
                        className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    >
                        Annuleer (Esc)
                    </button>
                </div>
            )}

            <div
                className="pointer-events-none absolute inset-0 origin-top-left"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                }}
            >
                <EdgeLayer nodes={nodes} edges={edges} />

                {previewEdge && (
                    <svg
                        className="pointer-events-none absolute z-[5] overflow-visible"
                        style={{
                            left: previewEdge.left,
                            top: previewEdge.top,
                            width: previewEdge.width,
                            height: previewEdge.height,
                        }}
                        viewBox={`0 0 ${previewEdge.width} ${previewEdge.height}`}
                    >
                        <path
                            data-preview-edge
                            d={previewEdge.d}
                            fill="none"
                            strokeWidth="2"
                            strokeDasharray={PREVIEW_DASH}
                            className="stroke-blue-400"
                        />
                    </svg>
                )}

                {
                    nodes.map((node: FlowNode) => (
                        <CanvasNode
                            key={node.id}
                            node={node}
                            scale={viewport.scale}
                            selected={node.id === selectedNodeId}
                            onSelect={pendingSourceId !== null ? () => {} : selectNode}
                            onMove={moveNode}
                            connectMode={pendingSourceId !== null}
                            isConnectSource={node.id === pendingSourceId}
                            onStartConnect={handleStartConnect}
                            onCompleteConnect={handleCompleteConnect}
                            onCancelConnect={handleCancelConnect}
                        />
                    ))
                }
            </div>
        </div>
    );
}
