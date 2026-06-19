import type {Point} from './edgeGeometry';

const PREVIEW_PADDING = 80;

export interface PreviewEdge {
    left: number;
    top: number;
    width: number;
    height: number;
    d: string;
}

export function computePreviewEdge(start: Point, end: Point): PreviewEdge {
    const left = Math.min(start.x, end.x) - PREVIEW_PADDING;
    const top = Math.min(start.y, end.y) - PREVIEW_PADDING;
    const right = Math.max(start.x, end.x) + PREVIEW_PADDING;
    const bottom = Math.max(start.y, end.y) + PREVIEW_PADDING;

    const width = right - left;
    const height = bottom - top;

    const startX = start.x - left;
    const startY = start.y - top;
    const endX = end.x - left;
    const endY = end.y - top;

    const controlOffset = Math.max(PREVIEW_PADDING, Math.abs(endX - startX) / 2);

    return {
        left,
        top,
        width,
        height,
        d: `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`,
    };
}
