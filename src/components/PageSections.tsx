import type { ReactNode } from "react";

type PageSectionProps = {
  children: ReactNode;
  title: string;
  description: string;
};

export function PageSection({ children, description, title }: PageSectionProps) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}
