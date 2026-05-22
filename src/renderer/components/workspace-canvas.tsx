"use client";

type WorkspaceCanvasProps = {
  children: React.ReactNode;
  className?: string;
};

export function WorkspaceCanvas({ children, className }: WorkspaceCanvasProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[1000px] overflow-visible px-4 sm:px-6 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
