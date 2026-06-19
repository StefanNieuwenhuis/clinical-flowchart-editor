import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFromStorage, saveToStorage, STORAGE_KEY } from './flowchartStorage';
import { initialFlowchart } from '../model/initialFlowchart';
import type { FlowchartDocument } from '../model/types';

const MODIFIED_TITLE = 'Opgeslagen testdiagram';

function makeLocalStorageMock(): Storage {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] ?? null,
    };
}

describe('flowchartStorage', () => {
    let localStorageMock: Storage;

    beforeEach(() => {
        localStorageMock = makeLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return initialFlowchart when localStorage is empty', () => {
        expect(loadFromStorage()).toEqual(initialFlowchart);
    });

    it('should save and restore a FlowchartDocument via localStorage', () => {
        const doc: FlowchartDocument = {
            ...initialFlowchart,
            title: MODIFIED_TITLE,
        };

        expect(saveToStorage(doc)).toBe(true);

        expect(loadFromStorage()).toEqual(doc);
    });

    it('should return false when writing to localStorage fails', () => {
        vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
            throw new Error('write failed');
        });

        expect(saveToStorage(initialFlowchart)).toBe(false);
    });

    it('should return initialFlowchart when stored JSON is malformed', () => {
        localStorage.setItem(STORAGE_KEY, '{ not valid json }');

        expect(loadFromStorage()).toEqual(initialFlowchart);
    });

    it('should return initialFlowchart when stored value lacks required fields', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ title: 'Incomplete' }));

        expect(loadFromStorage()).toEqual(initialFlowchart);
    });

    it('should return initialFlowchart when stored value is missing required FlowchartDocument fields (e.g. viewport)', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                title: 'Incomplete',
                version: '1.0.0',
                status: 'Concept',
                nodes: [],
                edges: [],
                selectedNodeId: null,
                selectedEdgeId: null,
                // viewport intentionally missing
            }),
        );

        expect(loadFromStorage()).toEqual(initialFlowchart);
    });
});
