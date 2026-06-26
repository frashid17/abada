import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type AiMessageContentProps = {
  content: string;
  className?: string;
};

const components: Components = {
  h1: ({ children }) => (
    <p className="mb-2 font-semibold text-foreground">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mb-2 font-semibold text-foreground">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mb-1.5 font-medium text-foreground">{children}</p>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
  ),
};

export function AiMessageContent({ content, className }: AiMessageContentProps) {
  return (
    <div className={cn("text-[15px] leading-relaxed text-foreground/90", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
