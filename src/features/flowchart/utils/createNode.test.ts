import {describe, expect, it} from 'vitest';
import {createNode} from "./createNode.ts";
import {nodeTypes} from "../model/nodeTypes.ts";


describe('createNode', () => {
    it('should create a node with the requested type and use provided parameters', () => {
        const node = createNode({id: 'node-1', type: 'decision', x: 120, y: 240});

        expect(node.title).toBe(nodeTypes.decision.defaultTitle);
        expect(node.body).toBe('');
        expect(node.x).toBe(120);
        expect(node.y).toBe(240);
        expect(node.id).toBe('node-1');
    });
});