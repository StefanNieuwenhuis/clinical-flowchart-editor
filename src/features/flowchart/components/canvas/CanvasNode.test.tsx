// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const END_NODE: FlowNode = {
    ...BASE_NODE,
    id: 'end-1',
    type: 'end',
    title: 'Einde',
};

function createConnectModeProps(overrides: Record<string, unknown> = {}) {
    return {
        connectMode: true as const,
        isConnectSource: false,
        isConnectTargetBlocked: false,
        hoveredTargetNodeId: null,
        onCancelConnect: vi.fn(),
        onCompleteConnect: vi.fn(),
        onBlockedConnectAttempt: vi.fn(),
        onSourceConnectorPointerDown: vi.fn(),
        onSourceConnectorActivate: vi.fn(),
        onTargetConnectorPointerUp: vi.fn(),
        onTargetConnectorActivate: vi.fn(),
        onTargetConnectorPointerEnter: vi.fn(),
        onTargetConnectorPointerLeave: vi.fn(),
        ...overrides,
    };
}

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

        const { container } = render(
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

        fireEvent.pointerDown(container.querySelector('[data-canvas-node]') as HTMLElement);
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

        const { container, rerender } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={true}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        const nodeButton = container.querySelector('[data-canvas-node]') as HTMLElement;

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

    it('renders a source connector for non-end nodes', () => {
        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        const sourceConnector = container.querySelector('[data-connector="source"]');
        expect(sourceConnector).toBeInTheDocument();
    });

    it('does not render a source connector for end nodes but renders a target connector', () => {
        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={END_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
            />,
        );

        const sourceConnector = container.querySelector('[data-connector="source"]');
        const targetConnector = container.querySelector('[data-connector="target"]');
        expect(sourceConnector).not.toBeInTheDocument();
        expect(targetConnector).toBeInTheDocument();
    });

    it('keeps the source connector visible during connect mode', () => {
        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                {...createConnectModeProps()}
            />,
        );

        const sourceConnector = container.querySelector('[data-connector="source"]');
        expect(sourceConnector).toBeInTheDocument();
    });

    it('calls onSourceConnectorPointerDown when source connector is clicked', () => {
        const onSourceConnectorPointerDown = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                onSourceConnectorPointerDown={onSourceConnectorPointerDown}
            />,
        );

        const sourceConnector = container.querySelector('[data-connector="source"]') as HTMLElement;
        fireEvent.pointerDown(sourceConnector);

        expect(onSourceConnectorPointerDown).toHaveBeenCalledWith(BASE_NODE.id, expect.any(Object));
    });

    it('calls onSourceConnectorActivate when Enter is pressed on the source connector', () => {
        const onSourceConnectorActivate = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                onSourceConnectorActivate={onSourceConnectorActivate}
            />,
        );

        fireEvent.keyDown(container.querySelector('[data-connector="source"]') as HTMLElement, { key: 'Enter' });

        expect(onSourceConnectorActivate).toHaveBeenCalledWith(BASE_NODE.id);
    });

    it('calls onCompleteConnect when a non-source node is clicked in connect mode', async () => {
        const user = userEvent.setup();
        const onCompleteConnect = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                {...createConnectModeProps({ onCompleteConnect })}
            />,
        );

        await user.click(container.querySelector('[data-canvas-node]') as HTMLElement);

        expect(onCompleteConnect).toHaveBeenCalledWith(BASE_NODE.id);
    });

    it('calls onTargetConnectorPointerUp when target connector pointerup fires', () => {
        const onTargetConnectorPointerUp = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                {...createConnectModeProps({ onTargetConnectorPointerUp })}
            />,
        );

        const targetConnector = container.querySelector('[data-connector="target"]') as HTMLElement;
        fireEvent.pointerUp(targetConnector);

        expect(onTargetConnectorPointerUp).toHaveBeenCalledWith(BASE_NODE.id, expect.any(Object));
    });

    it('calls onTargetConnectorActivate when Enter is pressed on the target connector in connect mode', () => {
        const onTargetConnectorActivate = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                {...createConnectModeProps({ onTargetConnectorActivate })}
            />,
        );

        fireEvent.keyDown(container.querySelector('[data-connector="target"]') as HTMLElement, { key: 'Enter' });

        expect(onTargetConnectorActivate).toHaveBeenCalledWith(BASE_NODE.id);
    });

    it('calls onBlockedConnectAttempt for blocked targets in connect mode', async () => {
        const user = userEvent.setup();
        const onBlockedConnectAttempt = vi.fn();
        const onCompleteConnect = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                {...createConnectModeProps({
                    isConnectTargetBlocked: true,
                    onBlockedConnectAttempt,
                    onCompleteConnect,
                })}
            />,
        );

        await user.click(container.querySelector('[data-canvas-node]') as HTMLElement);

        expect(onBlockedConnectAttempt).toHaveBeenCalledWith(BASE_NODE.id);
        expect(onCompleteConnect).not.toHaveBeenCalled();
    });

    it('calls onCancelConnect when the source node is clicked in connect mode', async () => {
        const user = userEvent.setup();
        const onCancelConnect = vi.fn();

        vi.mocked(useNodeDrag).mockReturnValue({
            onPointerDown: vi.fn(),
            onPointerMove: vi.fn(),
            onPointerUp: vi.fn(),
            onPointerCancel: vi.fn(),
        });

        const { container } = render(
            <CanvasNode
                node={BASE_NODE}
                selected={false}
                scale={SCALE}
                onSelect={vi.fn()}
                onMove={vi.fn()}
                {...createConnectModeProps({
                    isConnectSource: true,
                    onCancelConnect,
                })}
            />,
        );

        await user.click(container.querySelector('[data-canvas-node]') as HTMLElement);

        expect(onCancelConnect).toHaveBeenCalledTimes(1);
    });
});
