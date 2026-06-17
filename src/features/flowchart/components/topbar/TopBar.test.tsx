// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TopBar } from './TopBar';
import { useFlowchartStore } from '../../state/flowchartStore';
import userEvent from '@testing-library/user-event';

const EXPECTED_ACTION_LABELS = [
    'Ongedaan maken',
    'Opnieuw',
    'Layout',
    'Opslaan',
    'Downloaden',
] as const;
const EXPECTED_ACTION_BUTTON_COUNT = EXPECTED_ACTION_LABELS.length;
const UPDATED_TITLE = 'Bijgewerkte beslisboom';
const UPDATED_STATUS = 'Review';

describe('TopBar', () => {
    beforeEach(() => {
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
    });

    afterEach(() => {
        cleanup();
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
    });

    it('renders the current document title and status', () => {
        const { title, status } = useFlowchartStore.getState().document;

        render(<TopBar />);

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(status)).toBeInTheDocument();
    });

    it('renders all Dutch-labeled action buttons as type button', () => {
        render(<TopBar />);

        EXPECTED_ACTION_LABELS.forEach((label) => {
            const button = screen.getByRole('button', { name: label });

            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute('type', 'button');
        });

        expect(screen.getAllByRole('button')).toHaveLength(EXPECTED_ACTION_BUTTON_COUNT);
    });

    it('reacts to store updates for title and status', () => {
        render(<TopBar />);

        act(() => {
            const currentDocument = useFlowchartStore.getState().document;

            useFlowchartStore.setState({
                document: {
                    ...currentDocument,
                    title: UPDATED_TITLE,
                    status: UPDATED_STATUS,
                },
            });
        });

        expect(screen.getByText(UPDATED_TITLE)).toBeInTheDocument();
        expect(screen.getByText(UPDATED_STATUS)).toBeInTheDocument();
    });

    it('smoke: renders headline content and action buttons without crashing', () => {
        const { title, status } = useFlowchartStore.getState().document;

        render(<TopBar />);

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(status)).toBeInTheDocument();

        EXPECTED_ACTION_LABELS.forEach((label) => {
            expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        });

        expect(screen.getAllByRole('button')).toHaveLength(EXPECTED_ACTION_BUTTON_COUNT);
    });

    it('bumps patch version on explicit save action', async () => {
        const user = userEvent.setup();

        render(<TopBar />);

        await user.click(screen.getByRole('button', { name: 'Opslaan' }));

        expect(useFlowchartStore.getState().document.version).toBe('0.1.1');
    });

    it('does not bump version on download action', async () => {
        const user = userEvent.setup();
        const initialVersion = useFlowchartStore.getState().document.version;

        render(<TopBar />);

        await user.click(screen.getByRole('button', { name: 'Downloaden' }));

        expect(useFlowchartStore.getState().document.version).toBe(initialVersion);
    });
});
