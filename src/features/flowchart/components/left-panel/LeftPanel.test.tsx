// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {cleanup, render, screen} from "@testing-library/react";
import {useCanvasCommandStore} from "../../state/canvasCommandStore.ts";
import {LeftPanel} from "./LeftPanel.tsx";
import {nodeTypes} from "../../model/nodeTypes.ts";
import userEvent from "@testing-library/user-event";

describe('Left Panel', () => {
    afterEach(() => {
        cleanup();

        useCanvasCommandStore.setState({addNodeAtViewportCenter: undefined});
    });

    it('should render all available node types', () => {
        render(<LeftPanel />);

        Object.values(nodeTypes).forEach((definition) => {
            expect(
                screen.getByRole('button', {
                    name: new RegExp(definition.label, 'i'),
                }),
            ).toBeTruthy();
        });
    });

    it('should call addNodeAtViewportCenter with the clicked node type', async () => {
        const user = userEvent.setup();
        const addNodeAtViewportCenter = vi.fn();

        useCanvasCommandStore.setState({
            addNodeAtViewportCenter,
        });

        render(<LeftPanel />);

        await user.click(
            screen.getByRole('button', {
                name: new RegExp(nodeTypes.question.label, 'i'),
            }),
        );

        expect(addNodeAtViewportCenter).toHaveBeenCalledWith('question');
    });
});