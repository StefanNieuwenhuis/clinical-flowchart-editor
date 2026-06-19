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

        addNodeAtViewportCenter?.('decision');

        const document = useFlowchartStore.getState().document;
        const addedNode = document.nodes.at(-1);

        expect(document.nodes).toHaveLength(previousNodeCount + 1);
        expect(addedNode?.type).toBe('decision');

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

    it('shows a dotted preview edge during connect mode and updates it with mouse movement', () => {
        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        fireEvent.pointerDown(sourceConnectors[0] as HTMLElement);

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

    it('uses neutral preview color when connecting from start node', () => {
        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        fireEvent.pointerDown(sourceConnectors[0] as HTMLElement);

        const previewEdge = container.querySelector('[data-preview-edge]') as SVGPathElement;

        expect(previewEdge).toBeTruthy();
        expect(previewEdge).toHaveClass('stroke-slate-400');
    });

    it('uses warning preview color when connecting from non-start node', () => {
        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        fireEvent.pointerDown(sourceConnectors[1] as HTMLElement);

        const previewEdge = container.querySelector('[data-preview-edge]') as SVGPathElement;

        expect(previewEdge).toBeTruthy();
        expect(previewEdge).toHaveClass('stroke-amber-400');
    });

    it('completes a connection when a valid source-target pair is clicked', () => {
        const connectNodesSpy = vi.fn();

        useFlowchartStore.setState({ connectNodes: connectNodesSpy });

        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        const targetConnectors = container.querySelectorAll('[data-connector="target"]');

        // emergency (nodes[2]) -> q_color (nodes[1])
        // emergency is sourceConnectors[2], q_color is targetConnectors[0]
        fireEvent.pointerDown(sourceConnectors[2] as HTMLElement);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeTruthy();

        fireEvent.pointerUp(targetConnectors[0] as HTMLElement);

        expect(connectNodesSpy).toHaveBeenCalledTimes(1);
        expect(connectNodesSpy).toHaveBeenCalledWith(
            initialFlowchart.nodes[2].id,
            initialFlowchart.nodes[1].id,
        );
        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('allows connecting to a target node that already has other connections', () => {
        const connectNodesSpy = vi.fn();

        useFlowchartStore.setState({ connectNodes: connectNodesSpy });

        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        const targetConnectors = container.querySelectorAll('[data-connector="target"]');

        // emergency (nodes[2]) -> q_leakage (nodes[3])
        // emergency is sourceConnectors[2], q_leakage is targetConnectors[2]
        fireEvent.pointerDown(sourceConnectors[2] as HTMLElement);

        fireEvent.pointerUp(targetConnectors[2] as HTMLElement);

        expect(connectNodesSpy).toHaveBeenCalledTimes(1);
        expect(connectNodesSpy).toHaveBeenCalledWith(
            initialFlowchart.nodes[2].id,
            initialFlowchart.nodes[3].id,
        );
        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
    });

    it('keeps connect mode active and shows feedback when target is invalid', () => {
        const connectNodesSpy = vi.fn();

        useFlowchartStore.setState({ connectNodes: connectNodesSpy });

        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        const targetConnectors = container.querySelectorAll('[data-connector="target"]');

        // q_color (nodes[1]) -> q_leakage (nodes[3]) is a duplicate connection (already exists as edge e3)
        // q_color is sourceConnectors[1], q_leakage is targetConnectors[2]
        fireEvent.pointerDown(sourceConnectors[1] as HTMLElement);

        fireEvent.pointerUp(targetConnectors[2] as HTMLElement);

        expect(connectNodesSpy).not.toHaveBeenCalled();
        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent(/deze verbinding bestaat al/i);
        expect(container.querySelector('[data-preview-edge]')).toBeTruthy();
    });

    it('cancels connect mode when the source node is clicked again', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        fireEvent.pointerDown(sourceConnectors[0] as HTMLElement);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();

        const canvasNodeButtons = container.querySelectorAll('[data-canvas-node]');
        await user.click(canvasNodeButtons[0] as HTMLElement);

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('cancels connect mode when Escape is pressed', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        fireEvent.pointerDown(sourceConnectors[0] as HTMLElement);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();

        await user.keyboard('{Escape}');

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('cancels connect mode when the canvas background is clicked', () => {
        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        fireEvent.pointerDown(sourceConnectors[0] as HTMLElement);

        expect(screen.getByText(CONNECT_MODE_HINT)).toBeInTheDocument();

        fireEvent.pointerDown(container.firstChild as HTMLElement, { pointerId: 1 });

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('cancels connect mode from the explicit cancel button', async () => {
        const user = userEvent.setup();

        const { container } = render(<CanvasArea />);

        const sourceConnectors = container.querySelectorAll('[data-connector="source"]');
        fireEvent.pointerDown(sourceConnectors[0] as HTMLElement);

        await user.click(screen.getByText('Annuleer (Esc)'));

        expect(screen.queryByText(CONNECT_MODE_HINT)).not.toBeInTheDocument();
        expect(container.querySelector('[data-preview-edge]')).toBeNull();
    });

    it('deletes the selected node and connected edges with Delete', async () => {
        const user = userEvent.setup();
        const nodeId = initialFlowchart.nodes.find((node) => node.id === 'q_leakage')?.id;

        expect(nodeId).toBeTruthy();

        useFlowchartStore.getState().selectNode(nodeId!);

        render(<CanvasArea />);

        const stateBefore = useFlowchartStore.getState().document;
        const connectedEdgesBefore = stateBefore.edges.filter(
            (edge) => edge.from === nodeId || edge.to === nodeId,
        );

        await user.keyboard('{Delete}');

        const stateAfter = useFlowchartStore.getState().document;
        const deletedNode = stateAfter.nodes.find((node) => node.id === nodeId);
        const connectedEdgesAfter = stateAfter.edges.filter(
            (edge) => edge.from === nodeId || edge.to === nodeId,
        );

        expect(deletedNode).toBeUndefined();
        expect(connectedEdgesAfter).toHaveLength(0);
        expect(stateAfter.edges).toHaveLength(stateBefore.edges.length - connectedEdgesBefore.length);
        expect(stateAfter.selectedNodeId).toBeNull();
    });

    it('deletes the selected node with Backspace', async () => {
        const user = userEvent.setup();
        const nodeId = initialFlowchart.nodes.find((node) => node.id === 'q_leakage')?.id;

        expect(nodeId).toBeTruthy();

        useFlowchartStore.getState().selectNode(nodeId!);

        render(<CanvasArea />);

        await user.keyboard('{Backspace}');

        const deletedNode = useFlowchartStore
            .getState()
            .document.nodes.find((node) => node.id === nodeId);

        expect(deletedNode).toBeUndefined();
    });

    it('selects an edge when the edge path is clicked', () => {
        const edgeId = useFlowchartStore.getState().document.edges[0].id;

        const { container } = render(<CanvasArea />);

        const edgePath = container.querySelector(`[data-edge-id="${edgeId}"]`);

        expect(edgePath).toBeTruthy();

        fireEvent.click(edgePath as Element);

        const stateAfter = useFlowchartStore.getState().document;

        expect(stateAfter.selectedEdgeId).toBe(edgeId);
        expect(stateAfter.selectedNodeId).toBeNull();
    });

    it('deletes the selected edge with Delete and keeps connected nodes', async () => {
        const user = userEvent.setup();
        const stateBefore = useFlowchartStore.getState().document;
        const edgeToDelete = stateBefore.edges[0];
        const matchingEdgesBefore = stateBefore.edges.filter((edge) => edge.id === edgeToDelete.id);

        expect(edgeToDelete).toBeTruthy();

        useFlowchartStore.getState().selectEdge(edgeToDelete.id);

        render(<CanvasArea />);

        await user.keyboard('{Delete}');

        const stateAfter = useFlowchartStore.getState().document;
        const deletedEdge = stateAfter.edges.find((edge) => edge.id === edgeToDelete.id);
        const fromNode = stateAfter.nodes.find((node) => node.id === edgeToDelete.from);
        const toNode = stateAfter.nodes.find((node) => node.id === edgeToDelete.to);

        expect(deletedEdge).toBeUndefined();
        expect(fromNode).toBeTruthy();
        expect(toNode).toBeTruthy();
        expect(stateAfter.edges).toHaveLength(stateBefore.edges.length - matchingEdgesBefore.length);
    });

    it('deletes the selected edge with Backspace', async () => {
        const user = userEvent.setup();
        const edgeId = useFlowchartStore.getState().document.edges[0].id;

        useFlowchartStore.getState().selectEdge(edgeId);

        render(<CanvasArea />);

        await user.keyboard('{Backspace}');

        const edgeAfter = useFlowchartStore
            .getState()
            .document.edges.find((edge) => edge.id === edgeId);

        expect(edgeAfter).toBeUndefined();
    });

    it('does not delete when no node is selected', async () => {
        const user = userEvent.setup();

        useFlowchartStore.getState().clearSelection();

        render(<CanvasArea />);

        const stateBefore = useFlowchartStore.getState().document;

        await user.keyboard('{Delete}');

        expect(useFlowchartStore.getState().document).toEqual(stateBefore);
    });

    it('does not delete while typing in an input', async () => {
        const user = userEvent.setup();
        const nodeId = initialFlowchart.nodes.find((node) => node.id === 'q_leakage')?.id;

        expect(nodeId).toBeTruthy();

        useFlowchartStore.getState().selectNode(nodeId!);

        render(<CanvasArea />);

        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();

        await user.keyboard('{Backspace}');

        const remainingNode = useFlowchartStore
            .getState()
            .document.nodes.find((node) => node.id === nodeId);

        expect(remainingNode).toBeTruthy();

        input.remove();
    });
});
