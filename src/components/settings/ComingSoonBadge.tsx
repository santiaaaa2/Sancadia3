export default function ComingSoonBadge({ id }: { id?: string }) {
  return (
    <span
      id={id}
      className="inline-flex min-h-6 items-center rounded-full bg-background px-2 text-xs font-semibold text-subtle ring-1 ring-border"
    >
      Coming soon
    </span>
  );
}
