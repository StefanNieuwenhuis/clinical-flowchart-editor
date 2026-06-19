// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {cleanup, render, screen} from "@testing-library/react";

import {useFlowchartStore} from "../../state/flowchartStore.ts";
import {RightEditorPanel} from "./RightEditorPanel.tsx";
import userEvent from "@testing-library/user-event";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";

describe('RightEditorPanel', () => {
    beforeEach(() => {
        useFlowchartStore.getState().clearSelection();
        useCanvasCommandStore.setState({ focusTitleRequestId: 0 });
    });
    afterEach(() => {
        cleanup();
    });

    it('should not show the editor when no node is selected', () => {
        render(<RightEditorPanel />);

        expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    });

    it('should show the selected node details', () => {
        useFlowchartStore.getState().selectNode('start');

        render(<RightEditorPanel />);

        expect(screen.queryAllByRole('textbox')).not.toHaveLength(0);
    });

    it('should update the selected node title and body', async () => {
        const user = userEvent.setup();

        useFlowchartStore.getState().selectNode('start');

        render(<RightEditorPanel />);

        const textboxes = screen.getAllByRole('textbox');
        const titleInput = textboxes[0];
        const bodyInput = textboxes[1];

        await user.clear(titleInput);
        await user.type(titleInput, 'Updated title');

        await user.clear(bodyInput);
        await user.type(bodyInput, 'Updated body');

        const updatedNode = useFlowchartStore
            .getState()
            .document.nodes.find((node) => node.id === 'start');

        expect(updatedNode).toMatchObject({
            title: 'Updated title',
            body: 'Updated body',
        });
    });

    it('should clear the selection when the close button is clicked', async () => {
        const user = userEvent.setup();

        useFlowchartStore.getState().selectNode('start');

        render(<RightEditorPanel />);

        await user.click(screen.getByRole('button', { name: /sluit editor/i }));

        expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    });

    it('focuses title input when a new node focus request is triggered', () => {
        useCanvasCommandStore.getState().requestTitleFocus();
        useFlowchartStore.getState().selectNode('start');

        render(<RightEditorPanel />);

        expect(screen.getByLabelText('Titel')).toHaveFocus();
    });

    it('deletes the selected node and its connected edges from the visible delete action', async () => {
        const user = userEvent.setup();
        const nodeId = 'q_leakage';

        useFlowchartStore.getState().selectNode(nodeId);

        const edgesBefore = useFlowchartStore.getState().document.edges;
        const connectedEdgesBefore = edgesBefore.filter(
            (edge) => edge.from === nodeId || edge.to === nodeId,
        );

        render(<RightEditorPanel />);

        await user.click(screen.getByRole('button', { name: /verwijder stap/i }));

        const documentAfter = useFlowchartStore.getState().document;
        const nodeAfter = documentAfter.nodes.find((node) => node.id === nodeId);
        const connectedEdgesAfter = documentAfter.edges.filter(
            (edge) => edge.from === nodeId || edge.to === nodeId,
        );

        expect(connectedEdgesBefore.length).toBeGreaterThan(0);
        expect(nodeAfter).toBeUndefined();
        expect(documentAfter.selectedNodeId).toBeNull();
        expect(connectedEdgesAfter).toHaveLength(0);
        expect(documentAfter.edges).toHaveLength(edgesBefore.length - connectedEdgesBefore.length);
        expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    });

    it('shows the edge editor when an edge is selected', () => {
        const edgeId = useFlowchartStore.getState().document.edges[0].id;

        useFlowchartStore.getState().selectEdge(edgeId);

        render(<RightEditorPanel />);

        expect(screen.getByText(/verbinding bewerken/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /verwijder verbinding/i })).toBeInTheDocument();
    });

    it('updates the selected edge label from the edge editor', async () => {
        const user = userEvent.setup();
        const edgeId = useFlowchartStore.getState().document.edges.find((edge) => edge.from === 'q_color')?.id;

        expect(edgeId).toBeTruthy();

        useFlowchartStore.getState().selectEdge(edgeId!);

        render(<RightEditorPanel />);

        await user.selectOptions(screen.getByLabelText('Route-label'), 'Ja');

        const updatedEdge = useFlowchartStore
            .getState()
            .document.edges.find((edge) => edge.id === edgeId);

        expect(updatedEdge?.label).toBe('Ja');
    });

    it('deletes the selected edge from the edge editor', async () => {
        const user = userEvent.setup();
        const edgeId = useFlowchartStore.getState().document.edges[0].id;
        const edgesBefore = useFlowchartStore.getState().document.edges;
        const selectedEdgeBefore = edgesBefore.filter((edge) => edge.id === edgeId);

        useFlowchartStore.getState().selectEdge(edgeId);

        render(<RightEditorPanel />);

        await user.click(screen.getByRole('button', { name: /verwijder verbinding/i }));

        const documentAfter = useFlowchartStore.getState().document;
        const edgeAfter = documentAfter.edges.find((edge) => edge.id === edgeId);

        expect(edgeAfter).toBeUndefined();
        expect(documentAfter.selectedEdgeId).toBeNull();
        expect(documentAfter.edges).toHaveLength(edgesBefore.length - selectedEdgeBefore.length);
    });
});