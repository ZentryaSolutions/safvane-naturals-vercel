import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { looksLikeHtml } from "@/lib/rich-content";

interface RichTextContentProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null;
    return (
      <figure className="rich-content-figure">
        <Image
          src={src}
          alt={alt ?? ""}
          width={920}
          height={600}
          className="rich-content-img"
          sizes="(max-width: 920px) 100vw, 920px"
        />
        {alt && <figcaption>{alt}</figcaption>}
      </figure>
    );
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function RichTextContent({ content, className = "" }: RichTextContentProps) {
  if (!content?.trim()) return null;

  if (looksLikeHtml(content)) {
    return (
      <div
        className={`rich-content rich-content-html ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={`rich-content ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
