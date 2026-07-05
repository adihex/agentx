import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// A custom remark plugin could be written, but for simplicity we can pre-process 
// the markdown string to use standard markdown links that ReactMarkdown can handle,
// or we can provide custom components to ReactMarkdown.
// Let's use a regex to replace [[Entity]] with [Entity](/wiki/Entity) before passing to ReactMarkdown.

export default function TopicPage() {
  const { entity } = useParams<{ entity: string }>();
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTopic() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/wiki/${encodeURIComponent(entity || "")}`, {
          // If we need auth tokens, we should include them.
          // App.tsx uses fetch with credentials or auth client.
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("session_token")}`
          }
        });
        if (!res.ok) {
          throw new Error("Failed to fetch topic page");
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setMarkdown(data.markdown);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (entity) {
      fetchTopic();
    }
  }, [entity]);

  // Pre-process wikilinks [[Link]] -> [Link](/wiki/Link)
  const processedMarkdown = markdown.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
    return `[${p1}](/wiki/${encodeURIComponent(p1)})`;
  });

  if (loading) {
    return <div style={{ padding: 40, color: "var(--color-fg-muted)" }}>Loading topic...</div>;
  }

  if (error) {
    return <div style={{ padding: 40, color: "var(--color-danger)" }}>Error: {error}</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 40, fontFamily: "var(--font-sans)" }}>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/" style={{ color: "var(--color-brand)" }}>← Back to Zettel</Link>
      </nav>
      <div className="markdown-body">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => {
              if (props.href && props.href.startsWith("/wiki/")) {
                return <Link to={props.href}>{props.children}</Link>;
              }
              return <a {...props} />;
            }
          }}
        >
          {processedMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
