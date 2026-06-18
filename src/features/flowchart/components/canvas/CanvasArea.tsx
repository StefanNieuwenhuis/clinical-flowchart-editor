import {type ReactNode, type RefObject, useEffect, useRef, useState} from "react";
import {type FlowchartState, useFlowchartStore} from "../../state/flowchartStore.ts";
import type {FlowEdge, FlowNode, NodeType, Noop, ViewportState} from "../../model/types.ts";
import {EdgeLayer} from "./EdgeLayer.tsx";
import {CanvasNode} from "./CanvasNode.tsx";
import {useCanvasPanZoom} from "../../hooks/useCanvasPanZoom.ts";
import {NODE_HEIGHT, NODE_WIDTH, getGraphBounds} from "../../utils/graphBounds.ts";
import {ViewportControls} from "./ViewportControls.tsx";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";
import {getViewportCenterInWorld} from "../../utils/viewportMath.ts";
import {clamp} from "../../../../shared/utils/clamp.ts";
import {canConnectNodes} from "../../utils/connectionPolicy.ts";

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;

type ConnectionDraft = {
    sourceNodeId: string;
    pointerId: number;
    point: { x: number; y: number };
};

function getWorldPoint(
    canvas: HTMLDivElement,
    viewport: ViewportState,
    clientPoint: { x: number; y: number },
) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (clientPoint.x - rect.left - viewport.x) / viewport.scale,
        y: (clientPoint.y - rect.top - viewport.y) / viewport.scale,
    };
}

function findNodeAtPoint(nodes: FlowNode[], point: { x: number; y: number }): FlowNode | null {
    return (
        nodes.find((node) =>
            point.x >= node.x &&
            point.x <= node.x + NODE_WIDTH &&
            point.y >= node.y &&
            point.y <= node.y + NODE_HEIGHT,
        ) ?? null
    );
}

export function CanvasArea(): ReactNode {
    const canvasRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const [connectionDraft, setConnectionDraft] = useState<ConnectionDraft | null>(null);
    const connectionDraftRef = useRef<ConnectionDraft | null>(null);
    
    const nodes: FlowNode[] = useFlowchartStore((state: FlowchartState): FlowNode[] => state.document.nodes);
    const edges: FlowEdge[] = useFlowchartStore((state: FlowchartState): FlowEdge[] => state.document.edges);
    const selectedNodeId: string | null = useFlowchartStore((state: FlowchartState): string | null => state.document.selectedNodeId);
    const viewport: ViewportState = useFlowchartStore((state: FlowchartState): ViewportState => state.document.viewport);

    const nodesRef = useRef(nodes);
    const viewportRef = useRef(viewport);

    const addNodeOfTypeAt = useFlowchartStore((state: FlowchartState) => state.addNodeOfTypeAt);
    const setAddNodeAtViewportCenter = useCanvasCommandStore(
        (state) => state.setAddNodeAtViewportCenter,
    );
    const selectNode: (nodeId: string) => void = useFlowchartStore((state: FlowchartState): (nodeId: string) => void => state.selectNode);
    const clearSelection: Noop = useFlowchartStore((state: FlowchartState): () => void => state.clearSelection);
    const moveNode: (nodeId: string, position: {x: number, y:number}) => void = useFlowchartStore((state: FlowchartState): (nodeId: string, position: {x: number, y:number}) => void => state.moveNode);
    const addEdge = useFlowchartStore((state: FlowchartState) => state.addEdge);

    const setViewport: (viewport: ViewportState) => void = useFlowchartStore((state: FlowchartState): (viewport: ViewportState)=> void => state.setViewport);
    const resetViewport: Noop = useFlowchartStore((state: FlowchartState): Noop => state.resetViewport);
    const fitViewportToBounds = useFlowchartStore((state: FlowchartState) => state.fitViewportToBounds);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        viewportRef.current = viewport;
    }, [viewport]);

    function handleConnectStart(
        sourceNodeId: string,
        input: { pointerId: number; point: { x: number; y: number } },
    ) {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const point = getWorldPoint(canvas, viewport, input.point);

        const draft = {
            sourceNodeId,
            pointerId: input.pointerId,
            point,
        };

        connectionDraftRef.current = draft;
        setConnectionDraft(draft);
    }

    const panZoomHandlers = useCanvasPanZoom({
        canvasRef,
        viewport,
        setViewport,
        clearSelection
    });

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

    useEffect(() => {
        function updateDraftFromEvent(event: PointerEvent) {
            const currentDraft = connectionDraftRef.current;

            if (!currentDraft || event.pointerId !== currentDraft.pointerId) {
                return;
            }

            const canvas = canvasRef.current;

            if (!canvas) {
                return;
            }

            const nextPoint = getWorldPoint(canvas, viewportRef.current, {
                x: event.clientX,
                y: event.clientY,
            });

            connectionDraftRef.current = {
                ...currentDraft,
                point: nextPoint,
            };

            setConnectionDraft(connectionDraftRef.current);
        }

        function finishDraft(event: PointerEvent) {
            const currentDraft = connectionDraftRef.current;

            if (!currentDraft || event.pointerId !== currentDraft.pointerId) {
                return;
            }

            const canvas = canvasRef.current;

            if (!canvas) {
                connectionDraftRef.current = null;
                setConnectionDraft(null);
                return;
            }

            const sourceNode = nodesRef.current.find((node) => node.id === currentDraft.sourceNodeId);
            const targetPoint = getWorldPoint(canvas, viewportRef.current, {
                x: event.clientX,
                y: event.clientY,
            });
            const targetNode = findNodeAtPoint(nodesRef.current, targetPoint);

            if (sourceNode && targetNode && canConnectNodes(sourceNode.type, targetNode.type)) {
                addEdge(sourceNode.id, targetNode.id);
            }

            connectionDraftRef.current = null;
            setConnectionDraft(null);
            document.body.style.userSelect = "";
        }

        window.addEventListener("pointermove", updateDraftFromEvent);
        window.addEventListener("pointerup", finishDraft);
        window.addEventListener("pointercancel", finishDraft);

        return () => {
            window.removeEventListener("pointermove", updateDraftFromEvent);
            window.removeEventListener("pointerup", finishDraft);
            window.removeEventListener("pointercancel", finishDraft);
        };
    }, [addEdge]);

    return (
        <div
            ref={canvasRef}
            {...panZoomHandlers}
            className="relative h-full w-full cursor-grab overflow-hidden bg-slate-50 active:cursor-grabbing"
        >
            <ViewportControls
                scale={viewport.scale}
                onZoomIn={() => handleZoomTo(viewport.scale + 0.1)}
                onZoomOut={() => handleZoomTo(viewport.scale - 0.1)}
                onReset={resetViewport} onFit={handleFitToScreen}
            />

            <div
                className="pointer-events-none absolute inset-0 origin-top-left"
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                }}
            >
                <EdgeLayer nodes={nodes} edges={edges} previewConnection={connectionDraft} />

                {
                    nodes.map((node: FlowNode) => (
                        <CanvasNode
                            key={node.id}
                            node={node}
                            scale={viewport.scale}
                            selected={node.id === selectedNodeId}
                            onSelect={selectNode}
                            onMove={moveNode}
                            onConnectStart={handleConnectStart}
                        />
                    ))
                }
            </div>
        </div>
    );
}