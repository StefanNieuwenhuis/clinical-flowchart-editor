import type {ReactNode} from "react";
import {type FlowchartState, useFlowchartStore} from "../../state/flowchartStore.ts";
import {Download, LayoutGrid, Redo2, Undo2} from "lucide-react";

export function TopBar(): ReactNode {
    const title: string = useFlowchartStore((state: FlowchartState) => state.document.title);
    const status: string = useFlowchartStore((state: FlowchartState) => state.document.status);
    const saveDocument = useFlowchartStore((state: FlowchartState) => state.saveDocument);
    const exportDocument = useFlowchartStore((state: FlowchartState) => state.exportDocument);

    return (
        <div className="flex h-full items-center justify-between px-4">
            <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{title}</div>
                <div className="text-xs text-slate-500">{status}</div>
            </div>

            <div className="flex h-full items-center justify-between px-4">
                <button type="button" aria-label="Ongedaan maken" className="rounded-md p-2 hover:bg-slate-100"><Undo2 className="size-4"/></button>
                <button type="button" aria-label="Opnieuw" className="rounded-md p-2 hover:bg-slate-100"><Redo2 className="size-4"/></button>
                <button type="button" aria-label="Layout" className="rounded-md p-2 hover:bg-slate-100"><LayoutGrid className="size-4"/></button>
                <button type="button" aria-label="Opslaan" onClick={saveDocument} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">Opslaan</button>
                <button type="button" aria-label="Downloaden" onClick={exportDocument} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><Download className="size-4"/></button>
            </div>
        </div>
    );
}