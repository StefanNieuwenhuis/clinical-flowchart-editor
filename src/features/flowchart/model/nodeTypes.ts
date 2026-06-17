import type { NodeType } from "./types";

export interface NodeTypeDefinition {
    label: string;
    defaultTitle: string;
    terminal: boolean;
}

export const nodeTypes: Record<NodeType, NodeTypeDefinition> = {
    start: {
        label: "Start",
        defaultTitle: "Start stoma-observatie",
        terminal: false,
    },
    question: {
        label: "Vraag",
        defaultTitle: "Voer klinische vraag in",
        terminal: false,
    },
    action: {
        label: "Instructie",
        defaultTitle: "Geef instructie",
        terminal: true,
    },
    consult_nurse: {
        label: "Stomaverpleegkundige raadplegen",
        defaultTitle: "Raadpleeg stomaverpleegkundige",
        terminal: true,
    },
    consult_doctor: {
        label: "Arts contacteren",
        defaultTitle: "Arts contacteren",
        terminal: true,
    },
    emergency: {
        label: "Spoed",
        defaultTitle: "Zoek met spoed medische hulp",
        terminal: true,
    },
    end: {
        label: "Einde",
        defaultTitle: "Ga door met routinezorg",
        terminal: true,
    },
};