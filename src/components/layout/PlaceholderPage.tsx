type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="content-card" aria-labelledby="placeholder-title">
      <PageHeader eyebrow="SecureCare workspace" title={title} description={description} />
      <EmptyState
        title="Workspace not yet active"
        description="This navigation destination is reserved. No data or unfinished action is exposed here."
        icon="—"
      />
    </section>
  );
}
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
