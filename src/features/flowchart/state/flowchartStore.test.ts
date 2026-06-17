import { beforeEach, describe, expect, it } from 'vitest';
import {useFlowchartStore} from "./flowchartStore.ts";

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