import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="border-b border-gray-100 px-6 py-4">{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="px-6 py-5">{children}</div>;
}
