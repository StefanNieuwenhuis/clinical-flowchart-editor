import type { NodeType } from "./types";

export interface NodeTypeDefinition {
    label: string;
    defaultTitle: string;
    description: string;
    terminal: boolean;
}

export const nodeTypes: Record<NodeType, NodeTypeDefinition> = {
    start: {
        label: "Start",
        defaultTitle: "Start",
        description: "Begin het proces met een eerste observatie.",
        terminal: true,
    },
    decision: {
        label: "Vraag",
        defaultTitle: "Vraag",
        description: "Dit is een beslissing die een keuze bepaalt.",
        terminal: false,
    },
    process: {
        label: "Actie",
        defaultTitle: "Actie",
        description: "Voer hier een actie of interventie uit.",
        terminal: false,
    },
    end: {
        label: "Einde",
        defaultTitle: "Einde",
        description: "Rond het proces hier af.",
        terminal: true,
    },
};