import type { ReactNode } from "react";

type XpImageFrameProps = {
  label: string;
  status?: string;
  children: ReactNode;
  className?: string;
};

export function XpImageFrame({ label, status = "Objeto catalogado", children, className = "" }: XpImageFrameProps) {
  return (
    <div className={`xp-image-frame ${className}`.trim()}>
      <div className="xp-titlebar" aria-hidden="true">
        <span className="xp-title">
          <span className="xp-file-icon" aria-hidden="true" />
          <span>{label}</span>
        </span>
        <span className="xp-window-controls" aria-hidden="true">
          <i className="xp-window-control xp-window-minimize">_</i>
          <i className="xp-window-control xp-window-maximize">□</i>
          <i className="xp-window-control xp-window-close">×</i>
        </span>
      </div>
      <div className="xp-image-well">{children}</div>
      <div className="xp-statusbar" aria-hidden="true">
        <span>{status}</span>
        <span>InovArt Explorer</span>
      </div>
    </div>
  );
}
