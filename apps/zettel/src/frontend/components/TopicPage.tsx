import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../api-client";

function wikilinks(markdown: string): string {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_match, label: string) => {
    return `[${label}](/wiki/${encodeURIComponent(label)})`;
  });
}

export default function TopicPage() {
  const { entity = "" } = useParams<{ entity: string }>();
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void api.wiki
      .$get({ param: { entity } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "Failed to load topic");
        }
        if (active) setMarkdown(data.markdown);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entity]);

  if (loading) return <main aria-busy="true">Loading topic…</main>;
  if (error) return <main role="alert">Error: {error}</main>;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
      <nav>
        <Link to="/">← Back to Zettel</Link>
      </nav>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) =>
            href?.startsWith("/wiki/") ? (
              <Link to={href}>{children}</Link>
            ) : (
              <a href={href} {...props}>
                {children}
              </a>
            ),
        }}
      >
        {wikilinks(markdown)}
      </ReactMarkdown>
    </main>
  );
}
