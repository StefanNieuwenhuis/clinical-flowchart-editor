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

const CONNECT_MODE_HINT = /verbinding maken vanaf/i;
const TARGET_START_FEEDBACK = /niet verbinden naar een startknoop/i;

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

    it('shows a dotted preview edge during connect mode and updates it with mouse movement', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        const previewEdge = container.querySelector('[data-preview-edge]') as SVGPathElement;
        expect(previewEdge).toBeTruthy();
        const pathBefore = previewEdge.getAttribute('d');

        fireEvent.pointerMove(container.firstChild as HTMLElement, {
            pointerId: 1,
            clientX: 500,
            clientY: 300,
        });

        const pathAfter = (container.querySelector('[data-preview-edge]') as SVGPathElement).getAttribute('d');

        expect(pathAfter).not.toBe(pathBefore);
    });

    it('completes a connection when a valid source-target pair is clicked', async () => {
        const user = userEvent.setup();
        const connectNodesSpy = vi.fn();

        useFlowchartStore.setState({ connectNodes: connectNodesSpy });

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });

        // emergency -> q_color is a valid non-duplicate connection
        await user.click(portButtons[2]);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeTruthy();

        const canvasNodeButtons = container.querySelectorAll('[data-canvas-node]');
        await user.click(canvasNodeButtons[1] as HTMLElement);

        expect(connectNodesSpy).toHaveBeenCalledTimes(1);
        expect(connectNodesSpy).toHaveBeenCalledWith(
            initialFlowchart.nodes[2].id,
            initialFlowchart.nodes[1].id,
        );
        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('allows connecting to a target node that already has other connections', async () => {
        const user = userEvent.setup();
        const connectNodesSpy = vi.fn();

        useFlowchartStore.setState({ connectNodes: connectNodesSpy });

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });

        // emergency -> q_leakage should be valid even though q_leakage already has other edges
        await user.click(portButtons[2]);

        const canvasNodeButtons = container.querySelectorAll('[data-canvas-node]');
        await user.click(canvasNodeButtons[3] as HTMLElement);

        expect(connectNodesSpy).toHaveBeenCalledTimes(1);
        expect(connectNodesSpy).toHaveBeenCalledWith(
            initialFlowchart.nodes[2].id,
            initialFlowchart.nodes[3].id,
        );
        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
    });

    it('keeps connect mode active and shows feedback when target is invalid', async () => {
        const user = userEvent.setup();
        const connectNodesSpy = vi.fn();

        useFlowchartStore.setState({ connectNodes: connectNodesSpy });

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });

        // q_color -> start is disallowed
        await user.click(portButtons[1]);

        const canvasNodeButtons = container.querySelectorAll('[data-canvas-node]');
        await user.click(canvasNodeButtons[0] as HTMLElement);

        expect(connectNodesSpy).not.toHaveBeenCalled();
        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent(TARGET_START_FEEDBACK);
        expect(container.querySelector('[data-preview-edge]')).toBeTruthy();
    });

    it('cancels connect mode when the source node is clicked again', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();

        const canvasNodeButtons = container.querySelectorAll('[data-canvas-node]');
        await user.click(canvasNodeButtons[0] as HTMLElement);

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('cancels connect mode when Escape is pressed', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();

        await user.keyboard('{Escape}');

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('cancels connect mode when the canvas background is clicked', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();

        fireEvent.pointerDown(container.firstChild as HTMLElement, { pointerId: 1 });

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('cancels connect mode from the explicit cancel button', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const portButtons = screen.getAllByRole('button', { name: /verbind/i });
        await user.click(portButtons[0]);

        await user.click(screen.getByText('Annuleer (Esc)'));

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });
});
