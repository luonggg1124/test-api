"use client";

import { useCallback, useMemo, useState } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export default function Home() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState<string>("");
  const [queryString, setQueryString] = useState<string>("");
  const [headersText, setHeadersText] = useState<string>(`{
  "Content-Type": "application/json"
}`);
  const [bodyText, setBodyText] = useState<string>("{}");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const isBodyAllowed = useMemo(() => {
    return !(method === "GET" || method === "HEAD");
  }, [method]);

  const handleCall = useCallback(async () => {
    setError("");
    if (!url.trim()) {
      setError("Vui lòng nhập URL");
      return;
    }

    let fullUrl = url.trim();
    const qs = queryString.trim();
    if (qs) {
      const hasQuery = fullUrl.includes("?");
      fullUrl += (hasQuery ? "&" : "?") + qs.replace(/^\?/g, "");
    }

    let headers: Record<string, string> | undefined;
    if (headersText.trim()) {
      try {
        headers = JSON.parse(headersText);
      } catch (e) {
        setError("Headers không phải JSON hợp lệ");
        return;
      }
    }

    let body: BodyInit | undefined;
    if (isBodyAllowed && bodyText.trim()) {
      try {
        // Giữ nguyên chuỗi nếu là JSON hợp lệ; không ép stringify lần nữa
        const parsed = JSON.parse(bodyText);
        body = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
      } catch (e) {
        // Không phải JSON hợp lệ, gửi thẳng raw string
        body = bodyText;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch(fullUrl, {
        method,
        headers,
        body: isBodyAllowed ? body : undefined,
      });

      const contentType = res.headers.get("content-type") || "";
      let data: unknown;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else if (contentType.includes("text/")) {
        data = await res.text();
      } else {
        data = await res.arrayBuffer();
      }
      // Log kết quả ra console như yêu cầu
      // eslint-disable-next-line no-console
      console.log("API response:", data);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Đã xảy ra lỗi");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [url, queryString, headersText, bodyText, method, isBodyAllowed]);

  return (
    <div className="min-h-screen w-full flex items-start justify-center p-6 sm:p-10">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-semibold mb-4">API Tester</h1>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-2">
            <select
              className="border rounded px-3 py-2 bg-white dark:bg-zinc-900"
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
            >
              {(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as HttpMethod[]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder="https://api.example.com/resource"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="border rounded px-4 py-2 bg-black text-white disabled:opacity-50 dark:bg-white dark:text-black"
              onClick={handleCall}
              disabled={isLoading}
            >
              {isLoading ? "Đang gọi..." : "Gọi API"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm mb-1">Query (key1=val1&key2=val2)</label>
              <input
                className="border rounded px-3 py-2"
                placeholder="limit=10&offset=0"
                value={queryString}
                onChange={(e) => setQueryString(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Headers (JSON)</label>
              <textarea
                className="border rounded px-3 py-2 min-h-28 font-mono"
                spellCheck={false}
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm mb-1">Body {isBodyAllowed ? "(JSON hoặc raw)" : "(không áp dụng cho phương thức này)"}</label>
            <textarea
              className="border rounded px-3 py-2 min-h-40 font-mono disabled:opacity-50"
              spellCheck={false}
              disabled={!isBodyAllowed}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Kết quả sẽ được in ra Console của trình duyệt.
          </div>
        </div>
      </div>
    </div>
  );
}
