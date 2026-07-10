export default function FounderTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -mt-2 flex min-h-[calc(100dvh-5.5rem)] flex-col sm:-mx-6">
      {children}
    </div>
  );
}
