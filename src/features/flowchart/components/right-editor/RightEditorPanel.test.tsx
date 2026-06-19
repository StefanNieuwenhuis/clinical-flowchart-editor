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
});