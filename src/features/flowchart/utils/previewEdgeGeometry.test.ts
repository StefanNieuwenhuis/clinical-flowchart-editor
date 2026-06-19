import {describe, expect, it} from 'vitest';
import {computePreviewEdge} from './previewEdgeGeometry.ts';

const PREVIEW_PADDING = 80;

describe('previewEdgeGeometry', () => {
    it('returns the correct bounding box for a simple horizontal edge', () => {
        expect(computePreviewEdge({ x: 100, y: 200 }, { x: 300, y: 200 })).toMatchObject({
            left: 20,
            top: 120,
            width: 360,
            height: 160,
        });
    });

    it('returns the correct bounding box for reversed coordinates', () => {
        expect(computePreviewEdge({ x: 300, y: 250 }, { x: 100, y: 150 })).toMatchObject({
            left: 20,
            top: 70,
            width: 360,
            height: 260,
        });
    });

    it('returns a cubic bezier path string', () => {
        const previewEdge = computePreviewEdge({ x: 100, y: 200 }, { x: 300, y: 200 });

        expect(previewEdge.d).toMatch(/^M /);
        expect(previewEdge.d).toContain(' C ');
    });

    it('always returns positive width and height regardless of point order', () => {
        const forward = computePreviewEdge({ x: 100, y: 200 }, { x: 300, y: 150 });
        const reversed = computePreviewEdge({ x: 300, y: 150 }, { x: 100, y: 200 });

        expect(forward.width).toBeGreaterThan(0);
        expect(forward.height).toBeGreaterThan(0);
        expect(reversed.width).toBeGreaterThan(0);
        expect(reversed.height).toBeGreaterThan(0);
    });

    it('uses at least the preview padding as the control offset for very short edges', () => {
        const previewEdge = computePreviewEdge({ x: 100, y: 100 }, { x: 101, y: 101 });
        const match = previewEdge.d.match(/^M ([\d.]+) ([\d.]+) C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)$/);

        expect(match).toBeTruthy();

        const [, startX, , controlAX, , controlBX, , endX] = match as RegExpMatchArray;

        expect(Number(controlAX) - Number(startX)).toBeGreaterThanOrEqual(PREVIEW_PADDING);
        expect(Number(endX) - Number(controlBX)).toBeGreaterThanOrEqual(PREVIEW_PADDING);
    });

    it('offsets left and top by the preview padding from the minimum coordinate', () => {
        const previewEdge = computePreviewEdge({ x: 125, y: 210 }, { x: 400, y: 320 });

        expect(previewEdge.left).toBe(125 - PREVIEW_PADDING);
        expect(previewEdge.top).toBe(210 - PREVIEW_PADDING);
    });
});
