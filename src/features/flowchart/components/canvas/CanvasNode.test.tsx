// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasNode } from './CanvasNode';
import { nodeTypes } from '../../model/nodeTypes';
import type { FlowNode } from '../../model/types';
import { useNodeDrag } from '../../hooks/useNodeDrag';

vi.mock('../../hooks/useNodeDrag', () => ({
    useNodeDrag: vi.fn(),
}));

const NODE_X = 120;
const NODE_Y = 240;
const SCALE = 1.5;

const BASE_NODE: FlowNode = {
    id: 'node-1',
    type: 'question',
    title: 'Vraag titel',
    body: 'Details over de vraag',
    x: NODE_X,
    y: NODE_Y,
};

describe('CanvasNode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('passes drag hook options and attaches returned pointer handlers', () => {
        const onSelect = vi.fn();
        const onMove = vi.fn();
        const onPointerDown = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown,
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={onSelect}
                onMove={onMove}
            />,
        );

        expect(useNodeDrag).toHaveBeenCalledTimes(1);
        expect(useNodeDrag).toHaveBeenCalledWith({
            nodeId: BASE_NODE.id,
            x: BASE_NODE.x,
            y: BASE_NODE.y,
            scale: SCALE,
            onMove,
            onSelect,
        });

        fireEvent.pointerDown(screen.getByRole('button', { name: /vraag/i }));
        expect(onPointerDown).toHaveBeenCalledTimes(1);
    });

    it('renders label, title and type badge content', () => {
        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        expect(screen.getByText(nodeTypes[BASE_NODE.type].label)).toBeInTheDocument();
        expect(screen.getByText(BASE_NODE.title)).toBeInTheDocument();
        expect(screen.getByText(BASE_NODE.type)).toBeInTheDocument();
    });

    it('renders body text when body is non-empty', () => {
        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        expect(screen.getByText(BASE_NODE.body)).toBeInTheDocument();
    });

    it('does not render body text when body is empty', () => {
        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const nodeWithoutBody: FlowNode = {
            ...BASE_NODE,
            body: '',
        };

        render(
            <CanvasNode
                node={nodeWithoutBody}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        expect(screen.queryByText(BASE_NODE.body)).not.toBeInTheDocument();
    });

    it('applies semantic selected and unselected style tokens', () => {
        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { rerender } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={true}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        const nodeButton = screen.getByRole('button', { name: /vraag/i });

        expect(nodeButton).toHaveClass('ring-2');
        expect(nodeButton).toHaveClass('border-blue-500');

        rerender(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        expect(nodeButton).toHaveClass('border-slate-200');
        expect(nodeButton).toHaveClass('hover:border-slate-300');
    });
});
