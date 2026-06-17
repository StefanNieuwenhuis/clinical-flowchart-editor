import {nodeTypes} from "../../model/nodeTypes.ts";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";
import type {NodeType} from "../../model/types.ts";

export function LeftPanel() {

    const addNodeAtViewportCenter = useCanvasCommandStore(
        (state) => state.addNodeAtViewportCenter,
    );

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 p-4">
                <h2 className="text-sm font-semibold">Onderdelen</h2>
                <p className="mt-1 text-xs text-slate-500">
                    Voeg stappen toe aan de beslisboom.
                </p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {Object.entries(nodeTypes).map(([type, definition]) => {
                    const nodeType = type as NodeType;

                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => addNodeAtViewportCenter?.(nodeType)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-sm transition hover:bg-slate-50"
                        >
                            <div className="font-medium">{definition.label}</div>
                            <div className="mt-1 text-xs text-slate-500">
                                {definition.defaultTitle}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}