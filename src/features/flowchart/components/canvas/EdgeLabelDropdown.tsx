import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { RouteLabel } from "../../model/types";

interface EdgeLabelDropdownProps {
    edgeId: string;
    currentLabel: RouteLabel;
    x: number;
    y: number;
    onSelectLabel: (edgeId: string, label: "Ja" | "Nee") => void;
    onClose: () => void;
}

export function EdgeLabelDropdown({
    edgeId,
    currentLabel,
    x,
    y,
    onSelectLabel,
    onClose,
}: EdgeLabelDropdownProps): ReactNode {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    function handleSelect(label: "Ja" | "Nee") {
        onSelectLabel(edgeId, label);
        onClose();
    }

    return (
        <div
            ref={dropdownRef}
            className="absolute z-50 rounded-md border border-slate-200 bg-white shadow-lg"
            style={{
                left: x,
                top: y,
                minWidth: "120px",
            }}
        >
            <button
                type="button"
                onClick={() => handleSelect("Ja")}
                className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                    currentLabel === "Ja"
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                }`}
            >
                Ja
            </button>
            <button
                type="button"
                onClick={() => handleSelect("Nee")}
                className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${
                    currentLabel === "Nee"
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                }`}
            >
                Nee
            </button>
        </div>
    );
}
