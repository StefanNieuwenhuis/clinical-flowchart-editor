import type { FlowEdge, FlowNode } from "../../model/types";
import {getGraphBounds} from "../../utils/graphBounds.ts";
import {getEdgeLabelPosition, getEdgePath} from "../../utils/edgeGeometry.ts";
import { useState } from "react";


interface EdgeLayerProps {
    nodes: FlowNode[];
    edges: FlowEdge[];
    nodeHeights?: Map<string, number>;
    selectedEdgeId?: string | null;
    onEdgeSelect?: (edgeId: string) => void;
}

export function EdgeLayer({
    nodes,
    edges,
    nodeHeights = new Map(),
    selectedEdgeId = null,
    onEdgeSelect,
}: EdgeLayerProps) {
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
    const bounds = getGraphBounds(nodes);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));

    function isEdgeNeedsLabel(edge: FlowEdge): boolean {
        const fromNode = nodeById.get(edge.from);
        return fromNode?.type !== "start" && edge.label.trim() === "";
    }

    function getEdgeVisual(edge: FlowEdge, needsLabel: boolean): {
        strokeClass: string;
        markerId: string;
        labelClass: string;
    } {
        if (needsLabel) {
            return {
                strokeClass: "stroke-amber-400",
                markerId: "edge-arrow-warning",
                labelClass: "border-amber-200 bg-amber-50 text-amber-800",
            };
        }

        if (edge.label === "Ja") {
            return {
                strokeClass: "stroke-emerald-500",
                markerId: "edge-arrow-yes",
                labelClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
            };
        }

        if (edge.label === "Nee") {
            return {
                strokeClass: "stroke-rose-500",
                markerId: "edge-arrow-no",
                labelClass: "border-rose-200 bg-rose-50 text-rose-700",
            };
        }

        return {
            strokeClass: "stroke-slate-300",
            markerId: "edge-arrow-neutral",
            labelClass: "border-slate-200 bg-white text-slate-600",
        };
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
                    id="edge-arrow-neutral"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" className="fill-slate-400" />
                </marker>
                <marker
                    id="edge-arrow-yes"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" className="fill-emerald-500" />
                </marker>
                <marker
                    id="edge-arrow-no"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" className="fill-rose-500" />
                </marker>
                <marker
                    id="edge-arrow-warning"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" className="fill-amber-500" />
                </marker>
            </defs>

            {edges.map((edge) => {
                const from = nodeById.get(edge.from);
                const to = nodeById.get(edge.to);

                if (!from || !to) {
                    return null;
                }

                const needsLabel = isEdgeNeedsLabel(edge);
                const isSelected = selectedEdgeId === edge.id;
                const visual = getEdgeVisual(edge, needsLabel);
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
                            data-canvas-ui
                            data-edge-id={edge.id}
                            d={path}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="14"
                            strokeLinecap="round"
                            style={{ cursor: 'pointer' }}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => {
                                if (onEdgeSelect) {
                                    onEdgeSelect(edge.id);
                                }
                            }}
                            className="pointer-events-auto"
                        />

                        {isSelected && (
                            <path
                                data-selected-edge-halo
                                d={path}
                                fill="none"
                                strokeWidth="10"
                                strokeLinecap="round"
                                className="stroke-sky-300/60"
                                style={needsLabel ? { strokeDasharray: "4,4" } : undefined}
                            />
                        )}

                        <path
                            d={path}
                            fill="none"
                            strokeWidth={isSelected ? "4" : "2"}
                            style={needsLabel ? { strokeDasharray: "4,4" } : undefined}
                            markerEnd={`url(#${visual.markerId})`}
                            className={['pointer-events-none', visual.strokeClass].join(' ')}
                        />

                        {edge.label.trim() ? (
                            <g
                                data-canvas-ui
                                style={{ cursor: "pointer" }}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => {
                                    if (onEdgeSelect) {
                                        onEdgeSelect(edge.id);
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
                                    <div className={`flex h-6 items-center justify-center rounded-full border px-2 text-[11px] font-medium shadow-sm ${visual.labelClass}`}>
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
                                    if (onEdgeSelect) {
                                        onEdgeSelect(edge.id);
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