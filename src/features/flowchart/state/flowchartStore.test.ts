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

        useFlowchartStore.getState().addNodeOfTypeAt('question', {
            x: 120,
            y: 240,
        });

        const state = useFlowchartStore.getState();
        const addedNode = state.document.nodes.at(-1);

        expect(state.document.nodes).toHaveLength(previousNodeCount + 1);
        expect(addedNode).toMatchObject({
            type: 'question',
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

        useFlowchartStore.getState().addNodeOfTypeAt('question', {
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

    it('should reject additional connections for sources with Ja/Nee/Start labels', () => {
        const stateBefore = useFlowchartStore.getState().document;
        const sourceId = stateBefore.nodes.find((node) => node.id === 'q_color')?.id;
        const targetId = stateBefore.nodes.find((node) => node.id === 'routine')?.id;

        expect(sourceId).toBeTruthy();
        expect(targetId).toBeTruthy();

        const previousEdgeCount = stateBefore.edges.length;

        useFlowchartStore.getState().connectNodes(sourceId!, targetId!);

        expect(useFlowchartStore.getState().document.edges).toHaveLength(previousEdgeCount);
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

});
