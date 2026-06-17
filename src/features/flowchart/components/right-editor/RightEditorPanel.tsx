import type {ReactNode} from "react";
import {type FlowchartState, useFlowchartStore} from "../../state/flowchartStore.ts";
import {X} from "lucide-react";
import type {Noop} from "../../model/types.ts";

export function RightEditorPanel(): ReactNode {
    const selectedNodeId = useFlowchartStore((state) => state.document.selectedNodeId);
    const selectedNode = useFlowchartStore(
        (state) => state.document.nodes.find((node) => node.id === selectedNodeId) ?? null,
    );
    const updateNode = useFlowchartStore((state: FlowchartState) => state.updateNode);
    const clearSelection: Noop = useFlowchartStore((state: FlowchartState): Noop => state.clearSelection);

    if (!selectedNode) {
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
                        {selectedNode.id}
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
                        value={selectedNode.title}
                        onChange={(event): void =>
                            updateNode(selectedNode.id, { title: event.target.value })
                        }
                        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </label>

                <label className="block">
                    <span className="text-xs font-medium text-slate-600">Beschrijving</span>
                    <textarea
                        value={selectedNode.body}
                        onChange={(event): void =>
                            updateNode(selectedNode.id, { body: event.target.value })
                        }
                        rows={6}
                        className="mt-1 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                </label>
            </div>
        </div>
    );
}