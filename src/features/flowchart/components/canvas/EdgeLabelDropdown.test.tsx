// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EdgeLabelDropdown } from './EdgeLabelDropdown';

describe('EdgeLabelDropdown', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders both Ja and Nee buttons', () => {
        const onSelectLabel = vi.fn();
        const onClose = vi.fn();

        render(
            <EdgeLabelDropdown
                edgeId="e1"
                currentLabel=""
                x={100}
                y={100}
                onSelectLabel={onSelectLabel}
                onClose={onClose}
            />,
        );

        expect(screen.getByText('Ja')).toBeInTheDocument();
        expect(screen.getByText('Nee')).toBeInTheDocument();
    });

    it('calls onSelectLabel and onClose when Ja is clicked', async () => {
        const user = userEvent.setup();
        const onSelectLabel = vi.fn();
        const onClose = vi.fn();

        render(
            <EdgeLabelDropdown
                edgeId="e1"
                currentLabel=""
                x={100}
                y={100}
                onSelectLabel={onSelectLabel}
                onClose={onClose}
            />,
        );

        await user.click(screen.getByText('Ja'));

        expect(onSelectLabel).toHaveBeenCalledWith('e1', 'Ja');
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onSelectLabel and onClose when Nee is clicked', async () => {
        const user = userEvent.setup();
        const onSelectLabel = vi.fn();
        const onClose = vi.fn();

        render(
            <EdgeLabelDropdown
                edgeId="e1"
                currentLabel=""
                x={100}
                y={100}
                onSelectLabel={onSelectLabel}
                onClose={onClose}
            />,
        );

        await user.click(screen.getByText('Nee'));

        expect(onSelectLabel).toHaveBeenCalledWith('e1', 'Nee');
        expect(onClose).toHaveBeenCalled();
    });

    it('highlights the currently selected label', () => {
        const onSelectLabel = vi.fn();
        const onClose = vi.fn();

        render(
            <EdgeLabelDropdown
                edgeId="e1"
                currentLabel="Ja"
                x={100}
                y={100}
                onSelectLabel={onSelectLabel}
                onClose={onClose}
            />,
        );

        const jaButton = screen.getByText('Ja');
        expect(jaButton).toHaveClass('bg-blue-50');
    });

    it('closes on click outside', async () => {
        const user = userEvent.setup();
        const onSelectLabel = vi.fn();
        const onClose = vi.fn();

        const { container } = render(
            <div>
                <div data-testid="outside">Outside element</div>
                <EdgeLabelDropdown
                    edgeId="e1"
                    currentLabel=""
                    x={100}
                    y={100}
                    onSelectLabel={onSelectLabel}
                    onClose={onClose}
                />
            </div>,
        );

        const outside = container.querySelector('[data-testid="outside"]') as HTMLElement;
        await user.click(outside);

        expect(onClose).toHaveBeenCalled();
    });
});
