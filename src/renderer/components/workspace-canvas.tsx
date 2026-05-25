"use client";

type WorkspaceCanvasProps = {
  children: React.ReactNode;
  className?: string;
};

export function WorkspaceCanvas({ children, className }: WorkspaceCanvasProps) {
  return (
    <div
      className={`w-full min-w-0 max-w-none overflow-visible ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
