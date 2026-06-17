// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';

const SLOT_TOPBAR = 'Topbar slot';
const SLOT_SIDEBAR = 'Sidebar slot';
const SLOT_CANVAS = 'Canvas slot';
const SLOT_EDITOR = 'Editor slot';
const SLOT_STATUSBAR = 'Statusbar slot';
const SLOT_HELP = 'Help slot';
const EXPECTED_VISIBLE_SLOTS_WITHOUT_EDITOR = 5;
const EXPECTED_VISIBLE_SLOTS_WITH_EDITOR = 6;

function renderLayout(showEditor: boolean) {
    return render(
        <AppLayout
            topbar={<span>{SLOT_TOPBAR}</span>}
            sidebar={<span>{SLOT_SIDEBAR}</span>}
            canvas={<span>{SLOT_CANVAS}</span>}
            editor={<span>{SLOT_EDITOR}</span>}
            statusbar={<span>{SLOT_STATUSBAR}</span>}
            helpButton={<span>{SLOT_HELP}</span>}
            showEditor={showEditor}
        />,
    );
}

describe('AppLayout', () => {
    afterEach(() => {
        cleanup();
    });

    it('smoke: renders base layout slots without editor when showEditor is false', () => {
        renderLayout(false);

        expect(screen.getByText(SLOT_TOPBAR)).toBeInTheDocument();
        expect(screen.getByText(SLOT_SIDEBAR)).toBeInTheDocument();
        expect(screen.getByText(SLOT_CANVAS)).toBeInTheDocument();
        expect(screen.getByText(SLOT_STATUSBAR)).toBeInTheDocument();
        expect(screen.getByText(SLOT_HELP)).toBeInTheDocument();
        expect(screen.queryByText(SLOT_EDITOR)).not.toBeInTheDocument();

        expect(screen.getAllByText(/slot$/i)).toHaveLength(EXPECTED_VISIBLE_SLOTS_WITHOUT_EDITOR);
    });

    it('smoke: renders editor slot when showEditor is true', () => {
        renderLayout(true);

        expect(screen.getByText(SLOT_TOPBAR)).toBeInTheDocument();
        expect(screen.getByText(SLOT_SIDEBAR)).toBeInTheDocument();
        expect(screen.getByText(SLOT_CANVAS)).toBeInTheDocument();
        expect(screen.getByText(SLOT_EDITOR)).toBeInTheDocument();
        expect(screen.getByText(SLOT_STATUSBAR)).toBeInTheDocument();
        expect(screen.getByText(SLOT_HELP)).toBeInTheDocument();

        expect(screen.getAllByText(/slot$/i)).toHaveLength(EXPECTED_VISIBLE_SLOTS_WITH_EDITOR);
    });
});
