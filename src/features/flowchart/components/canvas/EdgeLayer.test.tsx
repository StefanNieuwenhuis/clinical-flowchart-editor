// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EdgeLayer } from './EdgeLayer';
import type { FlowEdge, FlowNode } from '../../model/types';

const nodes: FlowNode[] = [
    {
        id: 'start',
        type: 'start',
        title: 'Start',
        body: '',
        x: 100,
        y: 100,
    },
    {
        id: 'end',
        type: 'end',
        title: 'End',
        body: '',
        x: 400,
        y: 200,
    },
];

function asUnsafeRouteLabel(value: string): FlowEdge['label'] {
    return value as unknown as FlowEdge['label'];
}

describe('EdgeLayer', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders edge path when both edge endpoints exist', () => {
        const edges: FlowEdge[] = [
            { id: 'e1', from: 'start', to: 'end', label: 'Ja' },
        ];

        const { container } = render(<EdgeLayer nodes={nodes} edges={edges} onEdgeLabelClick={undefined} />);

        const edgePaths = container.querySelectorAll('path[marker-end]');

        expect(edgePaths).toHaveLength(1);
    });

    it('skips rendering edges with missing endpoints', () => {
        const edges: FlowEdge[] = [
            { id: 'e-missing', from: 'start', to: 'missing-node', label: 'Nee' },
        ];

        const { container } = render(<EdgeLayer nodes={nodes} edges={edges} onEdgeLabelClick={undefined} />);

        const edgePaths = container.querySelectorAll('path[marker-end]');

        expect(edgePaths).toHaveLength(0);
        expect(screen.queryByText('Nee')).not.toBeInTheDocument();
    });

    it('does not render labels for empty or whitespace-only labels', () => {
        const edges: FlowEdge[] = [
            { id: 'e-empty', from: 'start', to: 'end', label: '' },
            { id: 'e-space', from: 'start', to: 'end', label: asUnsafeRouteLabel(' ') },
            { id: 'e-tab', from: 'start', to: 'end', label: asUnsafeRouteLabel('\t') },
        ];

        const { container } = render(<EdgeLayer nodes={nodes} edges={edges} onEdgeLabelClick={undefined} />);

        const edgePaths = container.querySelectorAll('path[marker-end]');

        expect(edgePaths).toHaveLength(3);
        expect(container.querySelectorAll('foreignObject')).toHaveLength(0);
    });

    it('renders labels for non-empty trimmed label values', () => {
        const edges: FlowEdge[] = [
            { id: 'e-normal', from: 'start', to: 'end', label: 'Ja' },
        ];

        render(<EdgeLayer nodes={nodes} edges={edges} onEdgeLabelClick={undefined} />);

        expect(screen.getByText('Ja')).toBeInTheDocument();
    });

    it('shows dashed stroke for unlabeled non-start edges', () => {
        const nodes2: FlowNode[] = [
            {
                id: 'start',
                type: 'start',
                title: 'Start',
                body: '',
                x: 100,
                y: 100,
            },
            {
                id: 'decision',
                type: 'decision',
                title: 'Question',
                body: '',
                x: 400,
                y: 100,
            },
            {
                id: 'end',
                type: 'end',
                title: 'End',
                body: '',
                x: 700,
                y: 100,
            },
        ];
        const edges: FlowEdge[] = [
            { id: 'e1', from: 'start', to: 'decision', label: '' },
            { id: 'e2', from: 'decision', to: 'end', label: '' },
        ];

        const { container } = render(<EdgeLayer nodes={nodes2} edges={edges} onEdgeLabelClick={undefined} />);

        const paths = container.querySelectorAll('path[marker-end]');
        
        expect(paths).toHaveLength(2);
        
        const dashedPath = paths[1];
        expect(dashedPath).toHaveStyle('strokeDasharray: 4,4');
    });

    it('calls onEdgeLabelClick when edge label is clicked', async () => {
        const user = userEvent.setup();
        const onEdgeLabelClick = vi.fn();
        const edges: FlowEdge[] = [
            { id: 'e1', from: 'start', to: 'end', label: 'Ja' },
        ];

        render(
            <EdgeLayer nodes={nodes} edges={edges} onEdgeLabelClick={onEdgeLabelClick} />
        );

        const labelText = screen.getByText('Ja');
        const labelGroup = labelText.closest('g');
        
        if (labelGroup) {
            await user.click(labelGroup);
            expect(onEdgeLabelClick).toHaveBeenCalledWith('e1', expect.any(Number), expect.any(Number));
        }
    });

    it('applies semantic colors for Ja and Nee edges', () => {
        const edges: FlowEdge[] = [
            { id: 'e-ja', from: 'start', to: 'end', label: 'Ja' },
            { id: 'e-nee', from: 'start', to: 'end', label: 'Nee' },
        ];

        const { container } = render(
            <EdgeLayer nodes={nodes} edges={edges} onEdgeLabelClick={undefined} />,
        );

        const edgePaths = container.querySelectorAll('path[marker-end]');

        expect(edgePaths).toHaveLength(2);
        expect(edgePaths[0]).toHaveClass('stroke-emerald-500');
        expect(edgePaths[1]).toHaveClass('stroke-rose-500');

        expect(screen.getByText('Ja')).toHaveClass('bg-emerald-50');
        expect(screen.getByText('Nee')).toHaveClass('bg-rose-50');
    });
});
