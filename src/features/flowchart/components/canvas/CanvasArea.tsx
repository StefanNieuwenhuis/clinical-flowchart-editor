import {type ReactNode, type RefObject, useEffect, useRef, useState} from "react";
import {type FlowchartState, useFlowchartStore} from "../../state/flowchartStore.ts";
import type {FlowEdge, FlowNode, NodeType, Noop, ViewportState} from "../../model/types.ts";
import {EdgeLayer} from "./EdgeLayer.tsx";
import {CanvasNode} from "./CanvasNode.tsx";
import {useCanvasPanZoom} from "../../hooks/useCanvasPanZoom.ts";
import {getGraphBounds, NODE_HEIGHT} from "../../utils/graphBounds.ts";
import {ViewportControls} from "./ViewportControls.tsx";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";
import {getViewportCenterInWorld} from "../../utils/viewportMath.ts";
import {clamp} from "../../../../shared/utils/clamp.ts";
import {getSourceConnectorCenter} from "../../utils/edgeGeometry.ts";
import {EdgeLabelDropdown} from "./EdgeLabelDropdown.tsx";

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
    const updateEdge = useFlowchartStore((state: FlowchartState) => state.updateEdge);
    const moveNode: (nodeId: string, position: {x: number, y:number}) => void = useFlowchartStore((state: FlowchartState): (nodeId: string, position: {x: number, y:number}) => void => state.moveNode);

    const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);
    const [previewCursorWorld, setPreviewCursorWorld] = useState<Point | null>(null);
    const [connectFeedback, setConnectFeedback] = useState<string | null>(null);
    const [dragSourceNodeId, setDragSourceNodeId] = useState<string | null>(null);
    const [dragCursorWorld, setDragCursorWorld] = useState<Point | null>(null);
    const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);
    const [nodeHeights, setNodeHeights] = useState<Map<string, number>>(new Map());
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [edgeLabelDropdownPos, setEdgeLabelDropdownPos] = useState<Point | null>(null);
    const nodeRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

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
            setConnectFeedback(null);
            setDragSourceNodeId(null);
            setDragCursorWorld(null);
            setHoveredTargetNodeId(null);
        },
    });

    function handleNodeRef(nodeId: string, element: HTMLDivElement | null) {
        if (element) {
            nodeRefs.current.set(nodeId, element);

            const nextHeight = element.offsetHeight;

            setNodeHeights((currentHeights) => {
                if (currentHeights.get(nodeId) === nextHeight) {
                    return currentHeights;
                }

                const nextHeights = new Map(currentHeights);
                nextHeights.set(nodeId, nextHeight);
                return nextHeights;
            });

            return;
        }

        nodeRefs.current.delete(nodeId);
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setPendingSourceId(null);
                setPreviewCursorWorld(null);
                setConnectFeedback(null);
                setDragSourceNodeId(null);
                setDragCursorWorld(null);
                setHoveredTargetNodeId(null);
                setSelectedEdgeId(null);
                setEdgeLabelDropdownPos(null);
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

    function getConnectionBlockReason(fromNode: FlowNode, toNode: FlowNode): string | null {
        if (fromNode.type === 'end') {
            return 'Een eindknoop kan geen uitgaande verbinding hebben.';
        }

        if (toNode.type === 'start') {
            return 'Je kunt niet verbinden naar een startknoop.';
        }

        const hasDuplicateConnection = edges.some(
            (edge) => edge.from === fromNode.id && edge.to === toNode.id,
        );

        if (hasDuplicateConnection) {
            return 'Deze verbinding bestaat al.';
        }

        return null;
    }

    function handleSourceConnectorPointerDown(sourceNodeId: string) {
        handleStartConnect(sourceNodeId);
    }

    function handleTargetConnectorPointerUp(targetNodeId: string) {
        handleCompleteConnect(targetNodeId);
    }

    function handleTargetConnectorPointerEnter() {
        // Optional: Could highlight the target visually during hover
        // For now, this is handled by the isConnectTargetBlocked prop
    }

    function handleTargetConnectorPointerLeave() {
        // Optional: Could remove highlighting
    }

    function handleStartConnect(nodeId: string) {
        const sourceNode = nodes.find((node) => node.id === nodeId);

        setPendingSourceId(nodeId);
        setConnectFeedback(null);

        if (!sourceNode) {
            setPreviewCursorWorld(null);
            return;
        }

        setPreviewCursorWorld(
            getSourceConnectorCenter(sourceNode, nodeHeights.get(sourceNode.id) ?? NODE_HEIGHT),
        );
    }

    function handleCompleteConnect(targetNodeId: string) {
        if (pendingSourceNode === null) {
            return;
        }

        const targetNode = nodes.find((node) => node.id === targetNodeId);

        if (!targetNode) {
            return;
        }

        const blockedReason = getConnectionBlockReason(pendingSourceNode, targetNode);

        if (blockedReason) {
            setConnectFeedback(blockedReason);
            return;
        }

        connectNodes(pendingSourceNode.id, targetNodeId);
        setPendingSourceId(null);
        setPreviewCursorWorld(null);
        setConnectFeedback(null);
    }

    function handleBlockedConnectAttempt(targetNodeId: string) {
        if (pendingSourceNode === null) {
            return;
        }

        const targetNode = nodes.find((node) => node.id === targetNodeId);

        if (!targetNode) {
            return;
        }

        const blockedReason = getConnectionBlockReason(pendingSourceNode, targetNode);

        if (!blockedReason) {
            return;
        }

        setConnectFeedback(blockedReason);
    }

    function handleCancelConnect() {
        setPendingSourceId(null);
        setPreviewCursorWorld(null);
        setConnectFeedback(null);
        setDragSourceNodeId(null);
        setDragCursorWorld(null);
        setHoveredTargetNodeId(null);
    }

    function handleEdgeLabelClick(edgeId: string, x: number, y: number) {
        setSelectedEdgeId(edgeId);
        setEdgeLabelDropdownPos({ x, y });
    }

    function handleEdgeLabelSelect(edgeId: string, label: "Ja" | "Nee") {
        updateEdge(edgeId, { label });
        setSelectedEdgeId(null);
        setEdgeLabelDropdownPos(null);
    }

    function handleEdgeLabelDropdownClose() {
        setSelectedEdgeId(null);
        setEdgeLabelDropdownPos(null);
    }

    function handleCanvasPointerMoveCapture(event: React.PointerEvent<HTMLDivElement>) {
        const worldPoint = toWorldPoint(event);

        if (!worldPoint) {
            return;
        }

        if (dragSourceNodeId) {
            setDragCursorWorld(worldPoint);
        }

        if (pendingSourceNode === null) {
            return;
        }

        const target = event.target;

        if (target instanceof Element && target.closest('[data-canvas-ui]')) {
            return;
        }

        setPreviewCursorWorld(worldPoint);
    }

    function handleCanvasPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
        if (pendingSourceId === null && dragSourceNodeId === null) {
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
        setConnectFeedback(null);
        setDragSourceNodeId(null);
        setDragCursorWorld(null);
        setHoveredTargetNodeId(null);
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
            const start = getSourceConnectorCenter(
                pendingSourceNode,
                nodeHeights.get(pendingSourceNode.id) ?? NODE_HEIGHT,
            );

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

    const dragSourceNode = dragSourceNodeId
        ? nodes.find((node) => node.id === dragSourceNodeId) ?? null
        : null;

    const dragPreviewEdge = dragSourceNode && dragCursorWorld
        ? (() => {
            const start = getSourceConnectorCenter(
                dragSourceNode,
                nodeHeights.get(dragSourceNode.id) ?? NODE_HEIGHT,
            );

            const end = dragCursorWorld;

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
                dragSourceNodeId !== null ? 'cursor-crosshair' : pendingSourceId === null ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
            ].join(' ')}
        >
            <ViewportControls
                scale={viewport.scale}
                onZoomIn={() => handleZoomTo(viewport.scale + 0.1)}
                onZoomOut={() => handleZoomTo(viewport.scale - 0.1)}
                onReset={resetViewport} onFit={handleFitToScreen}
            />

            {(pendingSourceNode || dragSourceNode) && (
                <div
                    data-canvas-ui
                    className="pointer-events-auto absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm"
                >
                    <span className="font-medium">
                        Verbinding maken vanaf: {(pendingSourceNode || dragSourceNode)?.title}
                    </span>

                    {connectFeedback && (
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700" role="status">
                            {connectFeedback}
                        </span>
                    )}

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
                <EdgeLayer nodes={nodes} edges={edges} nodeHeights={nodeHeights} onEdgeLabelClick={handleEdgeLabelClick} />

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

                {dragPreviewEdge && (
                    <svg
                        className="pointer-events-none absolute z-[5] overflow-visible"
                        style={{
                            left: dragPreviewEdge.left,
                            top: dragPreviewEdge.top,
                            width: dragPreviewEdge.width,
                            height: dragPreviewEdge.height,
                        }}
                        viewBox={`0 0 ${dragPreviewEdge.width} ${dragPreviewEdge.height}`}
                    >
                        <path
                            data-drag-preview-edge
                            d={dragPreviewEdge.d}
                            fill="none"
                            strokeWidth="2"
                            strokeDasharray={PREVIEW_DASH}
                            className="stroke-emerald-400"
                        />
                    </svg>
                )}

                {
                    nodes.map((node: FlowNode) => {
                        const isClickConnectSource = node.id === pendingSourceId;
                        const isDragSource = node.id === dragSourceNodeId;
                        const isConnectSource = isClickConnectSource || isDragSource;
                        const isInConnectMode = pendingSourceId !== null || dragSourceNodeId !== null;

                        const sourceNodeForBlockCheck = pendingSourceNode || dragSourceNode;
                        const blockedReason = sourceNodeForBlockCheck && !isConnectSource
                            ? getConnectionBlockReason(sourceNodeForBlockCheck, node)
                            : null;

                        return (
                            <CanvasNode
                                key={node.id}
                                node={node}
                                nodeRef={(element) => handleNodeRef(node.id, element)}
                                scale={viewport.scale}
                                selected={node.id === selectedNodeId}
                                onSelect={isInConnectMode ? () => {} : selectNode}
                                onMove={moveNode}
                                connectMode={isInConnectMode}
                                isConnectSource={isConnectSource}
                                isConnectTargetBlocked={Boolean(blockedReason)}
                                onCompleteConnect={handleCompleteConnect}
                                onBlockedConnectAttempt={handleBlockedConnectAttempt}
                                onCancelConnect={handleCancelConnect}
                                onSourceConnectorPointerDown={handleSourceConnectorPointerDown}
                                onTargetConnectorPointerUp={handleTargetConnectorPointerUp}
                                onTargetConnectorPointerEnter={handleTargetConnectorPointerEnter}
                                onTargetConnectorPointerLeave={handleTargetConnectorPointerLeave}
                                hoveredTargetNodeId={hoveredTargetNodeId}
                            />
                        );
                    })
                }
            </div>

            {selectedEdgeId && edgeLabelDropdownPos && (
                <EdgeLabelDropdown
                    edgeId={selectedEdgeId}
                    currentLabel={edges.find((e) => e.id === selectedEdgeId)?.label ?? ""}
                    x={viewport.x + edgeLabelDropdownPos.x * viewport.scale}
                    y={viewport.y + edgeLabelDropdownPos.y * viewport.scale}
                    onSelectLabel={handleEdgeLabelSelect}
                    onClose={handleEdgeLabelDropdownClose}
                />
            )}
        </div>
    );
}
