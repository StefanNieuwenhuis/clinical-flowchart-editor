// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasArea } from './CanvasArea';
import { useCanvasCommandStore } from '../../state/canvasCommandStore';
import { useFlowchartStore } from '../../state/flowchartStore';
import { getGraphBounds } from '../../utils/graphBounds';
import { NODE_HEIGHT, NODE_WIDTH } from '../../utils/graphBounds';

describe('CanvasArea', () => {
    beforeEach(() => {
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
        useCanvasCommandStore.setState({ addNodeAtViewportCenter: null });

        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800);

        Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
            configurable: true,
            value: vi.fn(),
        });
        Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
            configurable: true,
            value: vi.fn(),
        });
        Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
            configurable: true,
            value: vi.fn(() => true),
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
        useCanvasCommandStore.setState({ addNodeAtViewportCenter: null });
    });

    it('registers add-node handler and cleans it up on unmount', () => {
        const previousNodeCount = useFlowchartStore.getState().document.nodes.length;

        const { unmount } = render(<CanvasArea />);

        const addNodeAtViewportCenter =
            useCanvasCommandStore.getState().addNodeAtViewportCenter;

        expect(typeof addNodeAtViewportCenter).toBe('function');

        addNodeAtViewportCenter?.('question');

        const document = useFlowchartStore.getState().document;
        const addedNode = document.nodes.at(-1);

        expect(document.nodes).toHaveLength(previousNodeCount + 1);
        expect(addedNode?.type).toBe('question');

        unmount();

        expect(useCanvasCommandStore.getState().addNodeAtViewportCenter).toBeNull();
    });

    it('clamps zoom scale to strict boundaries', async () => {
        const user = userEvent.setup();

        render(<CanvasArea />);

        const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
        const zoomOutButton = screen.getByRole('button', { name: /zoom uit/i });

        for (let index = 0; index < 20; index += 1) {
            await user.click(zoomInButton);
        }

        expect(useFlowchartStore.getState().document.viewport.scale).toBe(2);

        for (let index = 0; index < 40; index += 1) {
            await user.click(zoomOutButton);
        }

        expect(useFlowchartStore.getState().document.viewport.scale).toBe(0.2);
    });

    it('delegates fit action and updates viewport to finite values', async () => {
        const user = userEvent.setup();

        const originalFitViewportToBounds =
            useFlowchartStore.getState().fitViewportToBounds;
        const fitViewportToBoundsSpy = vi.fn((options) => {
            originalFitViewportToBounds(options);
        });

        useFlowchartStore.setState({
            fitViewportToBounds: fitViewportToBoundsSpy,
        });

        render(<CanvasArea />);

        await user.click(screen.getByRole('button', { name: /pas in beeld/i }));

        expect(fitViewportToBoundsSpy).toHaveBeenCalledTimes(1);

        const call = fitViewportToBoundsSpy.mock.calls[0][0];
        const expectedBounds = getGraphBounds(useFlowchartStore.getState().document.nodes);

        expect(call.viewportWidth).toBe(1000);
        expect(call.viewportHeight).toBe(800);
        expect(call.bounds).toEqual(expectedBounds);

        const viewport = useFlowchartStore.getState().document.viewport;

        expect(Number.isFinite(viewport.x)).toBe(true);
        expect(Number.isFinite(viewport.y)).toBe(true);
        expect(Number.isFinite(viewport.scale)).toBe(true);
        expect(viewport.scale).toBeGreaterThan(0);
        expect(viewport.scale).toBeLessThanOrEqual(1);
    });

    it('creates an edge when a drag connects two compatible nodes', () => {
        render(<CanvasArea />);

        const startNode = useFlowchartStore
            .getState()
            .document.nodes.find((node) => node.id === 'start');
        const targetNode = useFlowchartStore
            .getState()
            .document.nodes.find((node) => node.id === 'q_color');

        expect(startNode).toBeDefined();
        expect(targetNode).toBeDefined();

        const startNodeButton = screen.getByRole('button', {
            name: /start stoma-observatie/i,
        });
        const connectHandle = within(startNodeButton).getByTitle('Verbind naar een volgende stap');
        const previousEdgeCount = useFlowchartStore.getState().document.edges.length;

        fireEvent.pointerDown(connectHandle, {
            pointerId: 1,
            clientX: startNode!.x + NODE_WIDTH - 1,
            clientY: startNode!.y + NODE_HEIGHT / 2,
        });
        fireEvent.pointerMove(connectHandle, {
            pointerId: 1,
            clientX: targetNode!.x + NODE_WIDTH / 2,
            clientY: targetNode!.y + NODE_HEIGHT / 2,
        });
        fireEvent.pointerUp(connectHandle, {
            pointerId: 1,
            clientX: targetNode!.x + NODE_WIDTH / 2,
            clientY: targetNode!.y + NODE_HEIGHT / 2,
        });

        const edges = useFlowchartStore.getState().document.edges;

        expect(edges).toHaveLength(previousEdgeCount + 1);
        expect(edges.at(-1)).toMatchObject({
            from: 'start',
            to: 'q_color',
            label: '',
        });
    });
});
