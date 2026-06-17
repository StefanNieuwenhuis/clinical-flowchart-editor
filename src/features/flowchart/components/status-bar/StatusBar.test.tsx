// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StatusBar } from './StatusBar';
import { useFlowchartStore } from '../../state/flowchartStore';
import userEvent from "@testing-library/user-event";

const FIRST_EDGE_INDEX = 0;
const MISSING_NODE_ID = 'missing-node';
const STATUS_LABEL_CONCEPT = 'Conceptversie';
const STATUS_LABEL_REVIEW = 'Ter beoordeling';
const VERSION_LABEL_INITIAL = 'Versie 0.1.0';
const VERSION_LABEL_REVIEW = 'Versie 1.2';

describe('StatusBar', () => {
    beforeEach(() => {
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
    });

    afterEach(() => {
        cleanup();
        useFlowchartStore.setState(useFlowchartStore.getInitialState());
    });

    it('should show validation status for the current document', () => {
        useFlowchartStore.getState().clearSelection();

        render(<StatusBar />);

        expect(screen.getByText(/valid/i)).toBeInTheDocument();
        expect(screen.getByText(STATUS_LABEL_CONCEPT)).toBeInTheDocument();
        expect(screen.getByText(VERSION_LABEL_INITIAL)).toBeInTheDocument();
    });

    it('should render mapped Dutch status label and prefixed version from document state', () => {
        const currentState = useFlowchartStore.getState();

        useFlowchartStore.setState({
            document: {
                ...currentState.document,
                status: 'Review',
                version: '1.2',
            },
        });

        render(<StatusBar />);

        expect(screen.getByText(STATUS_LABEL_REVIEW)).toBeInTheDocument();
        expect(screen.getByText(VERSION_LABEL_REVIEW)).toBeInTheDocument();
    });

    it('should show an error count when the document is invalid', () => {
        const currentState = useFlowchartStore.getState();

        useFlowchartStore.setState({
            document: {
                ...currentState.document,
                edges: currentState.document.edges.map((edge, index) =>
                    index === FIRST_EDGE_INDEX ? { ...edge, to: MISSING_NODE_ID } : edge,
                ),
            },
        });

        render(<StatusBar />);

        expect(screen.getByText(/1 fout/i)).toBeInTheDocument();
    });

    it('should show validation issues in the dropdown', async () => {
        const user = userEvent.setup();

        useFlowchartStore.setState({
            document: {
                ...useFlowchartStore.getState().document,
                edges: useFlowchartStore.getState().document.edges.map((edge, index) =>
                    index === FIRST_EDGE_INDEX ? { ...edge, to: MISSING_NODE_ID } : edge,
                ),
            },
        });

        render(<StatusBar />);

        await user.click(screen.getByText(/1 fout/i));

        expect(screen.getByText(/missing node/i)).toBeInTheDocument();
    });
});