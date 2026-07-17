export default function FounderLegalLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-[calc(100dvh-8rem)] flex-col">{children}</div>;
}
