import type { FlowEdge, FlowNode } from "../../model/types";
import {getGraphBounds} from "../../utils/graphBounds.ts";
import {getEdgeLabelPosition, getEdgePath} from "../../utils/edgeGeometry.ts";
import { useState } from "react";


interface EdgeLayerProps {
    nodes: FlowNode[];
    edges: FlowEdge[];
    nodeHeights?: Map<string, number>;
    onEdgeLabelClick?: (edgeId: string, x: number, y: number) => void;
}

export function EdgeLayer({ nodes, edges, nodeHeights = new Map(), onEdgeLabelClick }: EdgeLayerProps) {
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
    const bounds = getGraphBounds(nodes);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));

    function isEdgeNeedsLabel(edge: FlowEdge): boolean {
        const fromNode = nodeById.get(edge.from);
        return fromNode?.type !== "start" && edge.label.trim() === "";
    }

    return (
        <svg
            className="pointer-events-none absolute z-0 overflow-visible"
            style={{
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
            }}
            viewBox={`0 0 ${bounds.width} ${bounds.height}`}
        >
            <defs>
                <marker
                    id="edge-arrow"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" className="fill-slate-400" />
                </marker>
            </defs>

            {edges.map((edge) => {
                const from = nodeById.get(edge.from);
                const to = nodeById.get(edge.to);

                if (!from || !to) {
                    return null;
                }

                const needsLabel = isEdgeNeedsLabel(edge);
                const path = getEdgePath(
                    from,
                    to,
                    bounds,
                    nodeHeights.get(from.id),
                    nodeHeights.get(to.id),
                );
                const label = getEdgeLabelPosition(
                    from,
                    to,
                    bounds,
                    nodeHeights.get(from.id),
                    nodeHeights.get(to.id),
                );

                return (
                    <g key={edge.id}>
                        <path
                            d={path}
                            fill="none"
                            strokeWidth="2"
                            className={needsLabel ? "stroke-slate-300" : "stroke-slate-300"}
                            style={needsLabel ? { strokeDasharray: "4,4" } : undefined}
                            markerEnd="url(#edge-arrow)"
                        />

                        {edge.label.trim() ? (
                            <g
                                data-canvas-ui
                                style={{ cursor: onEdgeLabelClick ? "pointer" : "default" }}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                    if (onEdgeLabelClick) {
                                        onEdgeLabelClick(edge.id, label.x, label.y);
                                    }
                                }}
                                className="pointer-events-auto"
                            >
                                <foreignObject
                                    x={label.x - 24}
                                    y={label.y - 12}
                                    width="48"
                                    height="24"
                                >
                                    <div className="flex h-6 items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 shadow-sm">
                                        {edge.label}
                                    </div>
                                </foreignObject>
                            </g>
                        ) : null}

                        {needsLabel && (
                            <g
                                data-canvas-ui
                                style={{ cursor: "pointer" }}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                    if (onEdgeLabelClick) {
                                        onEdgeLabelClick(edge.id, label.x, label.y);
                                    }
                                }}
                                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                                onMouseLeave={() => setHoveredEdgeId(null)}
                                className="pointer-events-auto"
                            >
                                <circle
                                    cx={label.x}
                                    cy={label.y}
                                    r="16"
                                    fill="transparent"
                                />
                                <circle
                                    cx={label.x}
                                    cy={label.y}
                                    r="12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={hoveredEdgeId === edge.id ? "2.5" : "1.5"}
                                    className={hoveredEdgeId === edge.id ? "text-amber-500" : "text-amber-400"}
                                />
                                <circle
                                    cx={label.x}
                                    cy={label.y}
                                    r={hoveredEdgeId === edge.id ? "4" : "3"}
                                    fill="currentColor"
                                    className={hoveredEdgeId === edge.id ? "text-amber-500" : "text-amber-400"}
                                />
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}