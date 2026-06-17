import {describe, expect, it} from 'vitest';
import {getViewportCenterInWorld} from "./viewportMath.ts";
import {NODE_HEIGHT, NODE_WIDTH} from "./graphBounds.ts";

describe('getViewportCenterInWorld', () => {
    it('should return the canvas center when viewport has no pan or zoom', () => {
        const viewport = {x: 0, y: 0, scale: 1};
        const canvasWidth = 1000;
        const canvasHeight = 800;

        const x_expect = ((canvasWidth / 2) - viewport.x) / viewport.scale - NODE_WIDTH / 2;
        const y_expect = ((canvasHeight / 2) - viewport.y) / viewport.scale - NODE_HEIGHT / 2;

        expect(
            getViewportCenterInWorld({
                viewport,
                canvasWidth,
                canvasHeight,
            }),
        ).toEqual({
            x: x_expect,
            y: y_expect,
        });
    });

    it('should accont for viewport pan', () => {
        const viewport = {x: 100, y: 50, scale: 1};
        const canvasWidth = 1000;
        const canvasHeight = 800;

        const x_expect = ((canvasWidth / 2) - viewport.x) / viewport.scale - NODE_WIDTH / 2;
        const y_expect = ((canvasHeight / 2) - viewport.y) / viewport.scale - NODE_HEIGHT / 2;

        expect(
            getViewportCenterInWorld({
                viewport,
                canvasWidth,
                canvasHeight,
            }),
        ).toEqual({
            x: x_expect,
            y: y_expect,
        });
    });

    it('should account for viewport zoom', () => {
        const viewport = {x: 0, y: 0, scale: 2};
        const canvasWidth = 1000;
        const canvasHeight = 800;

        const x_expect = ((canvasWidth / 2) - viewport.x) / viewport.scale - NODE_WIDTH / 2;
        const y_expect = ((canvasHeight / 2) - viewport.y) / viewport.scale - NODE_HEIGHT / 2;

        expect(
            getViewportCenterInWorld({
                viewport,
                canvasWidth,
                canvasHeight,
            }),
        ).toEqual({
            x: x_expect,
            y: y_expect,
        });
    });

    it('should account for viewport pan AND zoom', () => {
        const viewport = {x: 100, y: 50, scale: 2};
        const canvasWidth = 1000;
        const canvasHeight = 800;

        const x_expect = ((canvasWidth / 2) - viewport.x) / viewport.scale - NODE_WIDTH / 2;
        const y_expect = ((canvasHeight / 2) - viewport.y) / viewport.scale - NODE_HEIGHT / 2;

        expect(
            getViewportCenterInWorld({
                viewport,
                canvasWidth,
                canvasHeight,
            }),
        ).toEqual({
            x: x_expect,
            y: y_expect,
        });
    });
});