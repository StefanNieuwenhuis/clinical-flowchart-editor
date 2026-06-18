// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasArea } from './CanvasArea';
import { useCanvasCommandStore } from '../../state/canvasCommandStore';
import { useFlowchartStore } from '../../state/flowchartStore';
import { getGraphBounds } from '../../utils/graphBounds';
import { initialFlowchart } from '../../model/initialFlowchart';

describe('CanvasArea', () => {
    beforeEach(() => {
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
        useCanvasCommandStore.setState({ addNodeAtViewportCenter: null });

        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800);

        HTMLElement.prototype.setPointerCapture = vi.fn();
        HTMLElement.prototype.releasePointerCapture = vi.fn();
        HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
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

    it('completes a connection when a port button then a target node is clicked', async () => {
        const user = userEvent.setup();
        const connectNodesSpy = vi.fn();

        useFlowchartStore.setState({ connectNodes: connectNodesSpy });

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });

        // Click the first port button (the 'start' node in initialFlowchart)
        await user.click(portButtons[0]);

        // Click the second canvas node (q_color, index 1 in initialFlowchart.nodes)
        const canvasNodeButtons = container.querySelectorAll('[data-canvas-node]');
        await user.click(canvasNodeButtons[1] as HTMLElement);

        expect(connectNodesSpy).toHaveBeenCalledTimes(1);
        expect(connectNodesSpy).toHaveBeenCalledWith(
            initialFlowchart.nodes[0].id,
            initialFlowchart.nodes[1].id,
        );
    });

    it('cancels connect mode when the source node is clicked again', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        // In connect mode port buttons are hidden
        expect(screen.queryAllByRole('button', { name: /verbind/i })).toHaveLength(0);

        // Click the source node itself (same index as the port button clicked)
        const canvasNodeButtons = container.querySelectorAll('[data-canvas-node]');
        await user.click(canvasNodeButtons[0] as HTMLElement);

        // Port buttons reappear after cancel
        expect(screen.getAllByRole('button', { name: /verbind/i }).length).toBeGreaterThan(0);
    });

    it('cancels connect mode when Escape is pressed', async () => {
        const user = userEvent.setup();

        render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        expect(screen.queryAllByRole('button', { name: /verbind/i })).toHaveLength(0);

        await user.keyboard('{Escape}');

        expect(screen.getAllByRole('button', { name: /verbind/i }).length).toBeGreaterThan(0);
    });

    it('cancels connect mode when the canvas background is clicked', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        expect(screen.queryAllByRole('button', { name: /verbind/i })).toHaveLength(0);

        fireEvent.pointerDown(container.firstChild as HTMLElement, { pointerId: 1 });

        expect(screen.getAllByRole('button', { name: /verbind/i }).length).toBeGreaterThan(0);
    });
});
