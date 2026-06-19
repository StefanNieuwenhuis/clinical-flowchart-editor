import type { FlowEdge, FlowNode } from "../../model/types";
import {getGraphBounds} from "../../utils/graphBounds.ts";
import {getEdgeLabelPosition, getEdgePath} from "../../utils/edgeGeometry.ts";


interface EdgeLayerProps {
    nodes: FlowNode[];
    edges: FlowEdge[];
    nodeHeights?: Map<string, number>;
}

export function EdgeLayer({ nodes, edges, nodeHeights = new Map() }: EdgeLayerProps) {
    const bounds = getGraphBounds(nodes);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));

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

                const path = getEdgePath(
                    from,
                    to,
                    bounds,
                    nodeHeights.get(from.id),
                    nodeHeights.get(to.id),
                );
                const label = getEdgeLabelPosition(from, to, bounds);

                return (
                    <g key={edge.id}>
                        <path
                            d={path}
                            fill="none"
                            strokeWidth="2"
                            className="stroke-slate-300"
                            markerEnd="url(#edge-arrow)"
                        />

                        {edge.label.trim() ? (
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
                        ) : null}
                    </g>
                );
            })}
        </svg>
    );
}