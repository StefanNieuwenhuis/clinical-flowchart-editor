import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './ids';

type UuidString = ReturnType<typeof crypto.randomUUID>;

const ID_PREFIX = 'question';
const PREFIX_SEPARATOR = '_';
const UUID_SAMPLE: UuidString = '12345678-aaaa-bbbb-cccc-1234567890ab';
const UUID_SUFFIX_LENGTH = 8;
const UNIQUE_SAMPLE_SIZE = 25;

function buildUuidFromIndex(index: number): UuidString {
    const head = String(index).padStart(UUID_SUFFIX_LENGTH, '0');
    return `${head}-aaaa-bbbb-cccc-1234567890ab`;
}

describe('createId', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns id with prefix and fixed-length suffix', () => {
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(UUID_SAMPLE);

        const id = createId(ID_PREFIX);

        expect(id).toBe(`${ID_PREFIX}${PREFIX_SEPARATOR}${UUID_SAMPLE.slice(0, UUID_SUFFIX_LENGTH)}`);
        expect(id.startsWith(`${ID_PREFIX}${PREFIX_SEPARATOR}`)).toBe(true);
        expect(id.split(PREFIX_SEPARATOR)[1]).toHaveLength(UUID_SUFFIX_LENGTH);
    });

    it('returns unique ids across sampled calls', () => {
        const uuidValues: UuidString[] = Array.from({ length: UNIQUE_SAMPLE_SIZE }, (_, index) =>
            buildUuidFromIndex(index + 1),
        );

        vi.spyOn(crypto, 'randomUUID').mockImplementation((): UuidString => {
            const nextUuid = uuidValues.shift();

            if (!nextUuid) {
                throw new Error('UUID sample exhausted');
            }

            return nextUuid;
        });

        const ids = Array.from({ length: UNIQUE_SAMPLE_SIZE }, () => createId(ID_PREFIX));

        expect(new Set(ids).size).toBe(UNIQUE_SAMPLE_SIZE);
    });
});
