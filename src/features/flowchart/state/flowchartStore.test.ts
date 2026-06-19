import { beforeEach, describe, expect, it } from 'vitest';
import {useFlowchartStore} from "./flowchartStore.ts";

const EDGE_COUNT_INCREMENT = 1;
const EMPTY_EDGE_LABEL = '';


describe('FlowchartStore', () => {
    beforeEach(() => {
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
    });

    it('should select a node', () => {
        useFlowchartStore.getState().selectNode('start');
        expect(useFlowchartStore.getState().document.selectedNodeId).toBe('start');
    });

    it('should clear the selected node', () => {
        useFlowchartStore.getState().selectNode('start');
        useFlowchartStore.getState().clearSelection();

        expect(useFlowchartStore.getState().document.selectedNodeId).toBeNull();
    });

    it('should update a node', () => {
        useFlowchartStore.getState().updateNode('start', {
            title: 'Updated start node',
            body: 'Updated body',
        });

        const updatedNode = useFlowchartStore
            .getState()
            .document.nodes.find((node) => node.id === 'start');

        expect(updatedNode).toMatchObject({
            title: 'Updated start node',
            body: 'Updated body',
        });
    });

    it('should move a node', () => {
        useFlowchartStore.getState().moveNode('start', {
            x: 300,
            y: 400,
        });

        const movedNode = useFlowchartStore
            .getState()
            .document.nodes.find((node) => node.id === 'start');

        expect(movedNode).toMatchObject({
            x: 300,
            y: 400,
        });
    });

    it('should set the viewport', () => {
        useFlowchartStore.getState().setViewport({
            x: 10,
            y: 20,
            scale: 1.5,
        });

        expect(useFlowchartStore.getState().document.viewport).toEqual({
            x: 10,
            y: 20,
            scale: 1.5,
        });
    });

    it('should reset the viewport', () => {
        useFlowchartStore.getState().setViewport({
            x: 10,
            y: 20,
            scale: 1.5,
        });

        useFlowchartStore.getState().resetViewport();

        expect(useFlowchartStore.getState().document.viewport).toEqual({
            x: 0,
            y: 0,
            scale: 1,
        });
    });

    it('should add a node of a given type at a position and selects it', () => {
        const previousNodeCount = useFlowchartStore.getState().document.nodes.length;

        useFlowchartStore.getState().addNodeOfTypeAt('decision', {
            x: 120,
            y: 240,
        });

        const state = useFlowchartStore.getState();
        const addedNode = state.document.nodes.at(-1);

        expect(state.document.nodes).toHaveLength(previousNodeCount + 1);
        expect(addedNode).toMatchObject({
            type: 'decision',
            x: 120,
            y: 240,
        });
        expect(state.document.selectedNodeId).toBe(addedNode?.id);
    });

    it('should connect two existing nodes with an empty label', () => {
        const stateBefore = useFlowchartStore.getState().document;
        const sourceId = stateBefore.nodes.find((node) => node.id === 'start')?.id;
        const targetId = stateBefore.nodes.find((node) => node.id === 'q_leakage')?.id;

        expect(sourceId).toBeTruthy();
        expect(targetId).toBeTruthy();

        const previousEdgeCount = stateBefore.edges.length;

        useFlowchartStore.getState().connectNodes(sourceId!, targetId!);

        const edges = useFlowchartStore.getState().document.edges;
        const addedEdge = edges.at(-1);

        expect(edges).toHaveLength(previousEdgeCount + EDGE_COUNT_INCREMENT);
        expect(addedEdge).toMatchObject({
            from: sourceId,
            to: targetId,
            label: EMPTY_EDGE_LABEL,
        });
    });

    it('should reject duplicate source-target connections', () => {
        const existingEdge = useFlowchartStore.getState().document.edges[0];
        const previousEdgeCount = useFlowchartStore.getState().document.edges.length;

        useFlowchartStore.getState().connectNodes(existingEdge.from, existingEdge.to);

        expect(useFlowchartStore.getState().document.edges).toHaveLength(previousEdgeCount);
    });

    it('should allow different sources to connect to the same target', () => {
        const stateBefore = useFlowchartStore.getState().document;

        const targetId = stateBefore.nodes.find((node) => node.id === 'q_leakage')?.id;
        const firstSourceId = stateBefore.nodes.find((node) => node.id === 'start')?.id;
        const secondSourceId = stateBefore.nodes.find((node) => node.id === 'emergency')?.id;

        expect(targetId).toBeTruthy();
        expect(firstSourceId).toBeTruthy();
        expect(secondSourceId).toBeTruthy();

        useFlowchartStore.getState().connectNodes(firstSourceId!, targetId!);
        useFlowchartStore.getState().connectNodes(secondSourceId!, targetId!);

        const matchingEdges = useFlowchartStore
            .getState()
            .document.edges.filter((edge) => edge.to === targetId);

        const uniqueSources = new Set(matchingEdges.map((edge) => edge.from));

        expect(uniqueSources.has(firstSourceId!)).toBe(true);
        expect(uniqueSources.has(secondSourceId!)).toBe(true);
    });

    it('should keep newly added nodes unconnected', () => {
        const NODE_X = 120;
        const NODE_Y = 240;
        const previousEdgeCount = useFlowchartStore.getState().document.edges.length;

        useFlowchartStore.getState().addNodeOfTypeAt('decision', {
            x: NODE_X,
            y: NODE_Y,
        });

        expect(useFlowchartStore.getState().document.edges).toHaveLength(previousEdgeCount);
    });

    it('should reject connections from end nodes', () => {
        const stateBefore = useFlowchartStore.getState().document;
        const endNodeId = stateBefore.nodes.find((node) => node.type === 'end')?.id;
        const targetId = stateBefore.nodes.find((node) => node.type !== 'end')?.id;

        expect(endNodeId).toBeTruthy();
        expect(targetId).toBeTruthy();

        const previousEdgeCount = stateBefore.edges.length;

        useFlowchartStore.getState().connectNodes(endNodeId!, targetId!);

        expect(useFlowchartStore.getState().document.edges).toHaveLength(previousEdgeCount);
    });

    it('should reject connections to start nodes', () => {
        const stateBefore = useFlowchartStore.getState().document;
        const sourceId = stateBefore.nodes.find((node) => node.id === 'emergency')?.id;
        const startNodeId = stateBefore.nodes.find((node) => node.type === 'start')?.id;

        expect(sourceId).toBeTruthy();
        expect(startNodeId).toBeTruthy();

        const previousEdgeCount = stateBefore.edges.length;

        useFlowchartStore.getState().connectNodes(sourceId!, startNodeId!);

        expect(useFlowchartStore.getState().document.edges).toHaveLength(previousEdgeCount);
    });

    it('should allow additional non-duplicate connections from existing sources', () => {
        const stateBefore = useFlowchartStore.getState().document;
        const sourceId = stateBefore.nodes.find((node) => node.id === 'q_color')?.id;
        const targetId = stateBefore.nodes.find((node) => node.id === 'routine')?.id;

        expect(sourceId).toBeTruthy();
        expect(targetId).toBeTruthy();

        const previousEdgeCount = stateBefore.edges.length;

        useFlowchartStore.getState().connectNodes(sourceId!, targetId!);

        const edges = useFlowchartStore.getState().document.edges;
        const addedEdge = edges.at(-1);

        expect(edges).toHaveLength(previousEdgeCount + EDGE_COUNT_INCREMENT);
        expect(addedEdge).toMatchObject({
            from: sourceId,
            to: targetId,
            label: EMPTY_EDGE_LABEL,
        });
    });

    it('should delete a selected node and all its connected edges', () => {
        const stateBefore = useFlowchartStore.getState().document;
        const nodeId = stateBefore.nodes.find((node) => node.id === 'q_leakage')?.id;

        expect(nodeId).toBeTruthy();

        useFlowchartStore.getState().selectNode(nodeId!);

        const connectedEdgesBefore = stateBefore.edges.filter(
            (edge) => edge.from === nodeId || edge.to === nodeId,
        );

        expect(connectedEdgesBefore.length).toBeGreaterThan(0);

        useFlowchartStore.getState().deleteNode(nodeId!);

        const stateAfter = useFlowchartStore.getState().document;
        const nodeAfter = stateAfter.nodes.find((node) => node.id === nodeId);
        const connectedEdgesAfter = stateAfter.edges.filter(
            (edge) => edge.from === nodeId || edge.to === nodeId,
        );

        expect(nodeAfter).toBeUndefined();
        expect(connectedEdgesAfter).toHaveLength(0);
        expect(stateAfter.edges).toHaveLength(stateBefore.edges.length - connectedEdgesBefore.length);
        expect(stateAfter.selectedNodeId).toBeNull();
    });

    it('should delete only the selected edge and keep connected nodes', () => {
        const stateBefore = useFlowchartStore.getState().document;
        const edgeToDelete = stateBefore.edges[0];

        expect(edgeToDelete).toBeTruthy();

        useFlowchartStore.getState().selectEdge(edgeToDelete.id);
        useFlowchartStore.getState().deleteEdge(edgeToDelete.id);

        const stateAfter = useFlowchartStore.getState().document;
        const deletedEdge = stateAfter.edges.find((edge) => edge.id === edgeToDelete.id);
        const fromNode = stateAfter.nodes.find((node) => node.id === edgeToDelete.from);
        const toNode = stateAfter.nodes.find((node) => node.id === edgeToDelete.to);

        expect(deletedEdge).toBeUndefined();
        expect(fromNode).toBeTruthy();
        expect(toNode).toBeTruthy();
        expect(stateAfter.edges).toHaveLength(stateBefore.edges.length - EDGE_COUNT_INCREMENT);
        expect(stateAfter.selectedEdgeId).toBeNull();
    });

    it('should clear selected edge when selecting a node', () => {
        const edgeId = useFlowchartStore.getState().document.edges[0].id;

        useFlowchartStore.getState().selectEdge(edgeId);
        useFlowchartStore.getState().selectNode('start');

        const stateAfter = useFlowchartStore.getState().document;

        expect(stateAfter.selectedNodeId).toBe('start');
        expect(stateAfter.selectedEdgeId).toBeNull();
    });

    it('should clear selected node when selecting an edge', () => {
        const edgeId = useFlowchartStore.getState().document.edges[0].id;

        useFlowchartStore.getState().selectNode('start');
        useFlowchartStore.getState().selectEdge(edgeId);

        const stateAfter = useFlowchartStore.getState().document;

        expect(stateAfter.selectedNodeId).toBeNull();
        expect(stateAfter.selectedEdgeId).toBe(edgeId);
    });

    it('should not change state when deleting a non-existing node', () => {
        const stateBefore = useFlowchartStore.getState().document;

        useFlowchartStore.getState().deleteNode('missing-node-id');

        const stateAfter = useFlowchartStore.getState().document;

        expect(stateAfter).toEqual(stateBefore);
    });

    it('should initialize with a semantic version', () => {
        expect(useFlowchartStore.getState().document.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should not bump version on edit actions before save', () => {
        const initialVersion = useFlowchartStore.getState().document.version;

        useFlowchartStore.getState().updateNode('start', { title: 'Edited title' });
        useFlowchartStore.getState().moveNode('start', { x: 111, y: 222 });

        expect(useFlowchartStore.getState().document.version).toBe(initialVersion);
    });

    it('should bump patch version on explicit save', () => {
        useFlowchartStore.getState().saveDocument();

        expect(useFlowchartStore.getState().document.version).toBe('0.1.1');
    });

    it('should not bump version on export', () => {
        const initialVersion = useFlowchartStore.getState().document.version;

        useFlowchartStore.getState().exportDocument();

        expect(useFlowchartStore.getState().document.version).toBe(initialVersion);
    });

    it('should update an edge label', () => {
        const edgeId = useFlowchartStore.getState().document.edges[1].id;

        useFlowchartStore.getState().updateEdge(edgeId, { label: 'Ja' });

        const updatedEdge = useFlowchartStore
            .getState()
            .document.edges.find((edge) => edge.id === edgeId);

        expect(updatedEdge?.label).toBe('Ja');
    });

    it('should prevent updating start node edge labels to non-empty', () => {
        const startEdge = useFlowchartStore.getState().document.edges.find(
            (edge) => {
                const fromNode = useFlowchartStore.getState().document.nodes.find(
                    (node) => node.id === edge.from,
                );
                return fromNode?.type === 'start';
            },
        );

        expect(startEdge).toBeTruthy();

        useFlowchartStore.getState().updateEdge(startEdge!.id, { label: 'Ja' });

        const updatedEdge = useFlowchartStore
            .getState()
            .document.edges.find((edge) => edge.id === startEdge!.id);

        expect(updatedEdge?.label).toBe('');
    });

    it('should allow updating non-start edge labels', () => {
        const nonStartEdge = useFlowchartStore.getState().document.edges.find(
            (edge) => {
                const fromNode = useFlowchartStore.getState().document.nodes.find(
                    (node) => node.id === edge.from,
                );
                return fromNode?.type !== 'start';
            },
        );

        expect(nonStartEdge).toBeTruthy();

        useFlowchartStore.getState().updateEdge(nonStartEdge!.id, { label: 'Nee' });

        const updatedEdge = useFlowchartStore
            .getState()
            .document.edges.find((edge) => edge.id === nonStartEdge!.id);

        expect(updatedEdge?.label).toBe('Nee');
    });

});
