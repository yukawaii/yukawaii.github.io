import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const ALLOWED_ORIGINS = [
// Локальная разработка
    "http://localhost:8080",
    "http://127.0.0.1:5500",
    "http://localhost:3000",    
    // GitHub Pages 
    "https://yukawaii.github.io",     
    // VK Игры (основные домены)
    "https://vk.com",
    "https://vk.ru",
    "https://vkontakte.ru",
    "https://vkplay.ru",
    "https://vkplay.com",
    "https://vkvideo.ru",    
    // Одноклассники (OK)
    "https://ok.ru",
    "https://odnoklassniki.ru",
    "https://okgames.ru"
];

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export default {
    async fetch(request) {
        const origin = request.headers.get("Origin");
        const isAllowed = ALLOWED_ORIGINS.includes(origin);

        const corsHeaders = {
            "Access-Control-Allow-Origin": isAllowed ? origin : "null",
            "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            const url = new URL(request.url);
            const targetUrl = url.searchParams.get("url");

            if (!targetUrl) {
                return new Response(
                    JSON.stringify({ error: "Missing 'url' query parameter" }),
                    { status: 400, headers: corsHeaders }
                );
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(targetUrl, {
                headers: { "User-Agent": USER_AGENT },
                signal: controller.signal,
                redirect: "follow",
            });
            clearTimeout(timeout);

            if (!response.ok) {
                return new Response(
                    JSON.stringify({ error: `HTTP ${response.status}` }),
                    { status: response.status >= 500 ? 502 : 400, headers: corsHeaders }
                );
            }

            const html = await response.text();

            if (!html || html.length < 100) {
                return new Response(
                    JSON.stringify({ error: "Empty or too-short response" }),
                    { status: 422, headers: corsHeaders }
                );
            }

            const { document } = parseHTML(html);

            if (document.baseURI !== targetUrl) {
                const base = document.createElement("base");
                base.href = targetUrl;
                document.head.appendChild(base);
            }

            const reader = new Readability(document);
            const article = reader.parse();

            if (!article) {
                const bodyText = document.body ? document.body.textContent : "";
                return new Response(
                    JSON.stringify({
                        title: document.title || targetUrl,
                        content: `<p>${bodyText.substring(0, 5000)}</p>`,
                        textContent: bodyText.substring(0, 5000),
                        byline: null,
                        siteName: null,
                        excerpt: null,
                        fallback: true,
                    }),
                    { status: 200, headers: corsHeaders }
                );
            }

            return new Response(
                JSON.stringify({
                    title: article.title,
                    content: article.content,
                    textContent: article.textContent,
                    byline: article.byline,
                    siteName: article.siteName,
                    excerpt: article.excerpt,
                }),
                { status: 200, headers: corsHeaders }
            );

        } catch (error) {
            console.error("Reader Worker Error:", error.message);
            let status = 500;
            let message = "Failed to fetch and parse article";
            if (error.name === "AbortError") {
                status = 504;
                message = "Request timed out (15s)";
            }
            return new Response(
                JSON.stringify({ error: message, detail: error.message }),
                { status, headers: corsHeaders }
            );
        }
    },
};