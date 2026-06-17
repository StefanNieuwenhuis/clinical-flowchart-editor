import type { ReactNode } from "react";

interface AppLayoutProps {
    topbar: ReactNode;
    sidebar: ReactNode;
    canvas: ReactNode;
    editor: ReactNode;
    statusbar: ReactNode;
    helpButton: ReactNode;
    showEditor: boolean;
}

export function AppLayout({
                              topbar,
                              sidebar,
                              canvas,
                              editor,
                              statusbar,
                              helpButton,
                              showEditor,
                          }: AppLayoutProps) {
    return (
        <div className="grid h-dvh grid-rows-[56px_1fr_28px] bg-slate-100 text-slate-950">
            <header className="border-b border-slate-200 bg-white">{topbar}</header>

            <main
                className={[
                    "grid min-h-0",
                    showEditor
                        ? "grid-cols-[280px_minmax(0,1fr)_360px]"
                        : "grid-cols-[280px_minmax(0,1fr)]",
                ].join(" ")}
            >
                <aside className="min-h-0 border-r border-slate-200 bg-white">
                    {sidebar}
                </aside>

                <section className="min-h-0 overflow-hidden">{canvas}</section>

                {showEditor ? (
                    <aside className="min-h-0 border-l border-slate-200 bg-white">
                        {editor}
                    </aside>
                ) : null}
            </main>

            <footer className="border-t border-slate-200 bg-white">
                {statusbar}
            </footer>

            {helpButton}
        </div>
    );
}