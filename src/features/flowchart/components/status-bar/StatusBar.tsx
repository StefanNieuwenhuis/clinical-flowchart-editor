import {validateFlowchartDocument} from "../../utils/validateFlowchart.ts";
import {useFlowchartStore} from "../../state/flowchartStore.ts";
import {useMemo} from "react";
import type { FlowchartStatus } from "../../model/types.ts";

const STATUS_LABELS: Record<FlowchartStatus, string> = {
    Concept: "Conceptversie",
    Review: "Ter beoordeling",
    Goedgekeurd: "Goedgekeurd",
};

export function StatusBar() {
    const document = useFlowchartStore((state) => state.document);
    const isDirty = useFlowchartStore((state) => state.isDirty);
    const lastSaveWasManual = useFlowchartStore((state) => state.lastSaveWasManual);

    const { issues, errorCount, warningCount } = useMemo(() => {
        const issues = validateFlowchartDocument(document);

        return {
            issues,
            errorCount: issues.filter((issue) => issue.severity === 'error').length,
            warningCount: issues.filter((issue) => issue.severity === 'warning').length,
        };
    }, [document]);

    const validationLabel =
        errorCount > 0
            ? `${errorCount} fout${errorCount === 1 ? '' : 'en'}`
            : warningCount > 0
                ? `${warningCount} waarschuwing${warningCount === 1 ? '' : 'en'}`
                : 'Valid';
    const statusLabel = STATUS_LABELS[document.status];
    const versionLabel = `Versie ${document.version}`;

    return (
        <div className="flex h-full items-center justify-between px-4 text-xs text-slate-500">
            <span>{isDirty ? 'Niet opgeslagen' : lastSaveWasManual ? 'Opgeslagen' : 'Automatisch opgeslagen'}</span>

            <span className="flex items-center gap-3">
                <span>{statusLabel}</span>
                <span>{versionLabel}</span>

                <details className="relative">
                    <summary className="cursor-pointer list-none rounded-md px-2 py-1 hover:bg-slate-100">
                        {validationLabel}
                    </summary>

                    {issues.length > 0 ? (
                        <div className="absolute bottom-full right-0 mb-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                            <div className="mb-2 text-xs font-semibold text-slate-700">
                                Validatieproblemen
                            </div>

                            <ul className="space-y-2 text-xs text-slate-600">
                                {issues.map((issue) => (
                                    <li
                                        key={`${issue.code}-${issue.nodeId ?? issue.edgeId ?? issue.message}`}
                                    >
                                        <span className="font-medium">
                                            {issue.severity === 'error' ? 'Fout' : 'Waarschuwing'}:
                                        </span>{' '}
                                        {issue.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </details>
            </span>
        </div>
    );
}