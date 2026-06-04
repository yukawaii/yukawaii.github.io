export async function onRequest(context) {
    const url = new URL(context.request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
        return new Response("Missing url param", { status: 400 });
    }

    // Security: Only allow reddit domains
    try {
        const u = new URL(targetUrl);
        const allowed = [
            'reddit.com', 'old.reddit.com', 'api.reddit.com', 'www.reddit.com',
            'redd.it', 'i.redd.it', 'preview.redd.it', 'v.redd.it',
            'imgur.com', 'i.imgur.com'
        ];
        const isAllowed = allowed.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
        if (!isAllowed) {
            return new Response("Forbidden: Domain not allowed", { status: 403 });
        }
    } catch (e) {
        return new Response("Invalid URL", { status: 400 });
    }

    // Fetch from Reddit
    // Reddit aggressively blocks non-browser user agents and cloud IPs.
    // We send a full set of modern Chrome headers to look as browser-like as possible.
    const response = await fetch(targetUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://www.reddit.com/",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Ch-Ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": "\"Windows\"",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1"
        }
    });

    // Re-wrap response with CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    // Preserve original content type (e.g. image/jpeg) logic handled by passing response.headers to newHeaders
    // but we must ensure we don't *overwrite* it with json unless we know it's json? 
    // Actually, simply removing the set("Content-Type") line is enough as newHeaders already has it from response.headers
    // newHeaders.set("Content-Type", "application/json");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}
