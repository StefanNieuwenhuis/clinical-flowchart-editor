import {type ReactNode, useEffect, useRef} from "react";
import {type FlowchartState, useFlowchartStore} from "../../state/flowchartStore.ts";
import {Trash2, X} from "lucide-react";
import type {Noop} from "../../model/types.ts";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";

export function RightEditorPanel(): ReactNode {
    const titleInputRef = useRef<HTMLInputElement | null>(null);
    const focusTitleRequestId = useCanvasCommandStore((state) => state.focusTitleRequestId);
    const lastHandledFocusRequestId = useRef<number>(0);
    const selectedNodeId = useFlowchartStore((state) => state.document.selectedNodeId);
    const selectedEdgeId = useFlowchartStore((state) => state.document.selectedEdgeId);
    const selectedNode = useFlowchartStore(
        (state) => state.document.nodes.find((node) => node.id === selectedNodeId) ?? null,
    );
    const selectedEdge = useFlowchartStore(
        (state) => state.document.edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    );
    const sourceNode = useFlowchartStore((state) => {
        if (!selectedEdgeId) {
            return null;
        }

        const edge = state.document.edges.find((candidate) => candidate.id === selectedEdgeId);

        if (!edge) {
            return null;
        }

        return state.document.nodes.find((node) => node.id === edge.from) ?? null;
    });
    const targetNode = useFlowchartStore((state) => {
        if (!selectedEdgeId) {
            return null;
        }

        const edge = state.document.edges.find((candidate) => candidate.id === selectedEdgeId);

        if (!edge) {
            return null;
        }

        return state.document.nodes.find((node) => node.id === edge.to) ?? null;
    });
    const updateNode = useFlowchartStore((state: FlowchartState) => state.updateNode);
    const updateEdge = useFlowchartStore((state: FlowchartState) => state.updateEdge);
    const deleteNode = useFlowchartStore((state: FlowchartState) => state.deleteNode);
    const deleteEdge = useFlowchartStore((state: FlowchartState) => state.deleteEdge);
    const clearSelection: Noop = useFlowchartStore((state: FlowchartState): Noop => state.clearSelection);

    useEffect(() => {
        if (focusTitleRequestId === lastHandledFocusRequestId.current) {
            return;
        }

        if (!selectedNodeId) {
            return;
        }

        lastHandledFocusRequestId.current = focusTitleRequestId;
        titleInputRef.current?.focus();
    }, [focusTitleRequestId, selectedNodeId]);

    if (!selectedNode && !selectedEdge) {
        return null;
    }

    if (selectedEdge) {
        const isStartSource = sourceNode?.type === 'start';

        return (
            <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-slate-950">
                            Verbinding bewerken
                        </h2>
                        <p className="mt-1 truncate text-xs text-slate-500">
                            {selectedEdge.id}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={clearSelection}
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Sluit editor"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        <p><span className="font-medium text-slate-700">Van:</span> {sourceNode?.title ?? selectedEdge.from}</p>
                        <p className="mt-1"><span className="font-medium text-slate-700">Naar:</span> {targetNode?.title ?? selectedEdge.to}</p>
                    </div>

                    <label className="block">
                        <span className="text-xs font-medium text-slate-600">Route-label</span>
                        <select
                            value={selectedEdge.label}
                            onChange={(event): void => updateEdge(selectedEdge.id, { label: event.target.value as "" | "Ja" | "Nee" })}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="">Geen label</option>
                            <option value="Ja" disabled={isStartSource}>Ja</option>
                            <option value="Nee" disabled={isStartSource}>Nee</option>
                        </select>
                    </label>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => deleteEdge(selectedEdge.id)}
                            className="inline-flex items-center gap-2 rounded-md border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                            aria-label="Verwijder verbinding"
                        >
                            <Trash2 className="size-4" />
                            Verwijder verbinding
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const node = selectedNode;

    if (!node) {
        return null;
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-950">
                        Stap bewerken
                    </h2>
                    <p className="mt-1 truncate text-xs text-slate-500">
                        {node.id}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={clearSelection}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Sluit editor"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <label className="block">
                    <span className="text-xs font-medium text-slate-600">Titel</span>
                    <input
                        ref={titleInputRef}
                        value={node.title}
                        onChange={(event): void =>
                            updateNode(node.id, { title: event.target.value })
                        }
                        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </label>

                <label className="block">
                    <span className="text-xs font-medium text-slate-600">Beschrijving</span>
                    <textarea
                        value={node.body}
                        onChange={(event): void =>
                            updateNode(node.id, { body: event.target.value })
                        }
                        rows={6}
                        className="mt-1 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </label>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => deleteNode(node.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-rose-300 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                        aria-label="Verwijder stap"
                    >
                        <Trash2 className="size-4" />
                        Verwijder stap
                    </button>
                </div>
            </div>
        </div>
    );
}