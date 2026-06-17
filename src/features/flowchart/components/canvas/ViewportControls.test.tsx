// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {ViewportControls} from "./ViewportControls.tsx";

const onZoomIn = vi.fn();
const onZoomOut = vi.fn();
const onReset = vi.fn();
const onFit = vi.fn();

describe('ViewportControls', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('calls onReset when reset button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <ViewportControls
                scale={1}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
                onFit={onFit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /reset weergave/i }));

        expect(onReset).toHaveBeenCalledTimes(1);
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();
        expect(onFit).not.toHaveBeenCalled();
    });

    it('calls onZoomIn when zoom in button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <ViewportControls
                scale={1}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
                onFit={onFit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Zoom in/i }));

        expect(onZoomIn).toHaveBeenCalledTimes(1);
        expect(onZoomOut).not.toHaveBeenCalled();
        expect(onReset).not.toHaveBeenCalled();
        expect(onFit).not.toHaveBeenCalled();
    });

    it('calls onZoomOut when zoom out button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <ViewportControls
                scale={1.5}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
                onFit={onFit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Zoom uit/i }));

        expect(onZoomOut).toHaveBeenCalledTimes(1);
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onReset).not.toHaveBeenCalled();
        expect(onFit).not.toHaveBeenCalled();
    });

    it('calls onFit when fit button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <ViewportControls
                scale={1}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onReset={onReset}
                onFit={onFit}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Pas in beeld/i }));

        expect(onFit).toHaveBeenCalledTimes(1);
        expect(onZoomIn).not.toHaveBeenCalled();
        expect(onZoomOut).not.toHaveBeenCalled();
        expect(onReset).not.toHaveBeenCalled();
    });
});