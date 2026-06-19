
import { HelpCircle } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {AppLayout} from "./layouts/AppLayout.tsx";
import { useFlowchartStore } from "./features/flowchart/state/flowchartStore";
import {TopBar} from "./features/flowchart/components/topbar/TopBar.tsx";
import {LeftPanel} from "./features/flowchart/components/left-panel/LeftPanel.tsx";
import {CanvasArea} from "./features/flowchart/components/canvas/CanvasArea.tsx";
import {RightEditorPanel} from "./features/flowchart/components/right-editor/RightEditorPanel.tsx";
import {StatusBar} from "./features/flowchart/components/status-bar/StatusBar.tsx";

export default function App() {
  const selectedNodeId = useFlowchartStore(
      (state) => state.document.selectedNodeId,
  );

  return (
      <>
        <AppLayout
            showEditor={selectedNodeId !== null}
            helpButton={<button
                type="button"
                className="fixed bottom-10 right-5 inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
                aria-label="Open hulp"
            >
              <HelpCircle className="size-5"/>
            </button>} topbar={<TopBar/>} sidebar={<LeftPanel/>} canvas={<CanvasArea/>} editor={<RightEditorPanel/>} statusbar={<StatusBar/>}
                  />
        <Analytics />
        <SpeedInsights />
      </>
  );
}