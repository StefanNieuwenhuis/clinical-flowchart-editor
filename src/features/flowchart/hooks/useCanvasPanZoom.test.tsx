// @vitest-environment jsdom

import {render, screen, fireEvent, cleanup} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import type {ViewportState} from "../model/types.ts";
import {useCanvasPanZoom} from "./useCanvasPanZoom.ts";

const initialViewport: ViewportState = {
    x: 0,
    y: 0,
    scale: 1,
};

function TestCanvasPanZoom({
                               viewport = initialViewport,
                               setViewport = vi.fn(),
                               clearSelection = vi.fn(),
                           }: {
    viewport?: ViewportState;
    setViewport?: (viewport: ViewportState) => void;
    clearSelection?: () => void;
}) {
    const canvasRef = useRef<HTMLDivElement | null>(null);

    const handlers = useCanvasPanZoom({
        canvasRef,
        viewport,
        setViewport,
        clearSelection,
    });

    return (
        <div
            ref={canvasRef}
            data-testid="canvas"
            style={{ width: 1000, height: 800 }}
            {...handlers}
        >
            <button type="button" data-testid="inside-button">
                Button
            </button>
        </div>
    );
}

describe('useCanvasPanZoom', () => {
    beforeEach(() => {
        vi.restoreAllMocks();

        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            width: 1000,
            height: 800,
            top: 0,
            left: 0,
            right: 1000,
            bottom: 800,
            toJSON: () => {},
        } as DOMRect);

        HTMLElement.prototype.setPointerCapture = vi.fn();
        HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
        HTMLElement.prototype.releasePointerCapture = vi.fn();
    });

    afterEach(() => {
        cleanup();
        document.body.style.userSelect = '';
    });

    it('should clear selection when pointer down starts on the canvas', () => {
        const clearSelection = vi.fn();

        render(<TestCanvasPanZoom clearSelection={clearSelection} />);

        fireEvent.pointerDown(screen.getByTestId('canvas'), {
            clientX: 100,
            clientY: 100,
            button: 0,
        });

        expect(clearSelection).toHaveBeenCalledTimes(1);
    });

    it('should pan the viewport when dragging the canvas', () => {
        const setViewport = vi.fn();

        render(<TestCanvasPanZoom setViewport={setViewport} />);

        const canvas = screen.getByTestId('canvas');

        fireEvent.pointerDown(canvas, {
            clientX: 100,
            clientY: 100,
            button: 0,
        });

        fireEvent.pointerMove(canvas, {
            clientX: 140,
            clientY: 130,
        });

        expect(setViewport).toHaveBeenCalledWith({
            x: 40,
            y: 30,
            scale: 1,
        });
    });

    it('should zoom around the pointer position', () => {
        const setViewport = vi.fn();

        render(<TestCanvasPanZoom setViewport={setViewport} />);

        const canvas = screen.getByTestId('canvas');

        fireEvent.wheel(canvas, {
            clientX: 500,
            clientY: 400,
            deltaY: -100,
        });

        expect(setViewport).toHaveBeenCalled();

        const nextViewport = setViewport.mock.calls[0][0];

        expect(nextViewport.scale).toBeGreaterThan(1);
        expect(nextViewport.x).toBeLessThan(0);
        expect(nextViewport.y).toBeLessThan(0);
    });

    it('should not start panning when pointer down starts on a button', () => {
        const clearSelection = vi.fn();
        const setViewport = vi.fn();

        render(
            <TestCanvasPanZoom
                clearSelection={clearSelection}
                setViewport={setViewport}
            />,
        );

        fireEvent.pointerDown(screen.getByTestId('inside-button'), {
            clientX: 100,
            clientY: 100,
            button: 0,
        });

        fireEvent.pointerMove(screen.getByTestId('canvas'), {
            clientX: 140,
            clientY: 130,
        });

        expect(clearSelection).not.toHaveBeenCalled();
        expect(setViewport).not.toHaveBeenCalled();
    });
});