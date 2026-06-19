// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNodeDrag } from './useNodeDrag';
import type {FlowNode, ViewportState} from "../model/types.ts";
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';

const testNode: FlowNode = {
    id: 'node-1',
    type: 'decision',
    title: 'Question',
    body: '',
    x: 100,
    y: 200,
};

const viewport: ViewportState = {
    x: 0,
    y: 0,
    scale: 1,
};

function TestNodeDrag({
    onSelect = vi.fn(),
    onMove = vi.fn(),
    scale = viewport.scale,
}: {
    onSelect?: (nodeId: string) => void;
    onMove?: (nodeId: string, position: { x: number; y: number }) => void;
    scale?: number;
}) {
    const dragHandlers = useNodeDrag({
        nodeId: testNode.id,
        x: testNode.x,
        y: testNode.y,
        scale,
        onMove,
        onSelect
    });

    return (
        <button type="button" data-testid="node" {...dragHandlers}>
            Drag node
        </button>
    );
}

describe('useNodeDrag', () => {
    beforeEach(() => {
        HTMLElement.prototype.setPointerCapture = vi.fn();
        HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
        HTMLElement.prototype.releasePointerCapture = vi.fn();
    });

    afterEach(() => {
        cleanup();
    });

    it('should select the node when clicked without dragging', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(<TestNodeDrag onSelect={onSelect} />);

        await user.pointer([
            { target: screen.getByTestId('node'), keys: '[MouseLeft>]', coords: { x: 100, y: 100 } },
            { keys: '[/MouseLeft]', coords: { x: 100, y: 100 } },
        ]);

        expect(onSelect).toHaveBeenCalledWith('node-1');
    });

    it('should keep click selection at low zoom when movement stays under pixel threshold', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const onMove = vi.fn();

        render(<TestNodeDrag onSelect={onSelect} onMove={onMove} scale={0.2} />);

        await user.pointer([
            { target: screen.getByTestId('node'), keys: '[MouseLeft>]', coords: { x: 100, y: 100 } },
            { target: screen.getByTestId('node'), coords: { x: 103, y: 103 } },
            { keys: '[/MouseLeft]', coords: { x: 103, y: 103 } },
        ]);

        expect(onMove).not.toHaveBeenCalled();
        expect(onSelect).toHaveBeenCalledWith('node-1');
    });
});