import {NODE_HEIGHT, NODE_WIDTH} from "./graphBounds.ts";
import type {ViewportState} from "../model/types.ts";

export function getViewportCenterInWorld({ viewport, canvasWidth, canvasHeight,}: {viewport: ViewportState, canvasWidth: number, canvasHeight: number}){
    const screenCenterX = canvasWidth / 2;
    const screenCenterY = canvasHeight / 2;

    return {
        x: (screenCenterX - viewport.x) / viewport.scale - NODE_WIDTH / 2,
        y: (screenCenterY - viewport.y) / viewport.scale - NODE_HEIGHT / 2,
    }
}
