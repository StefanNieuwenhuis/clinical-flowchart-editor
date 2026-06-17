import {type ReactNode, type RefObject, useEffect, useRef} from "react";
import {type FlowchartState, useFlowchartStore} from "../../state/flowchartStore.ts";
import type {FlowEdge, FlowNode, NodeType, Noop, ViewportState} from "../../model/types.ts";
import {EdgeLayer} from "./EdgeLayer.tsx";
import {CanvasNode} from "./CanvasNode.tsx";
import {useCanvasPanZoom} from "../../hooks/useCanvasPanZoom.ts";
import {getGraphBounds} from "../../utils/graphBounds.ts";
import {ViewportControls} from "./ViewportControls.tsx";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";
import {getViewportCenterInWorld} from "../../utils/viewportMath.ts";
import {clamp} from "../../../../shared/utils/clamp.ts";

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.0;

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
    const moveNode: (nodeId: string, position: {x: number, y:number}) => void = useFlowchartStore((state: FlowchartState): (nodeId: string, position: {x: number, y:number}) => void => state.moveNode);

    const setViewport: (viewport: ViewportState) => void = useFlowchartStore((state: FlowchartState): (viewport: ViewportState)=> void => state.setViewport);
    const resetViewport: Noop = useFlowchartStore((state: FlowchartState): Noop => state.resetViewport);
    const fitViewportToBounds = useFlowchartStore((state: FlowchartState) => state.fitViewportToBounds);

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
                <EdgeLayer nodes={nodes} edges={edges} />

                {
                    nodes.map((node: FlowNode) => (
                        <CanvasNode
                            key={node.id}
                            node={node}
                            scale={viewport.scale}
                            selected={node.id === selectedNodeId}
                            onSelect={selectNode}
                            onMove={moveNode}
                        />
                    ))
                }
            </div>
        </div>
    );
}