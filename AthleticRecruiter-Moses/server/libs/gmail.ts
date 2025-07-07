// lib/gmail.ts
import { google } from "googleapis";
import base64url from "base64url";
import decode from "base64url";

import { JSDOM } from "jsdom";

// Create a fresh OAuth2 client instance per request
// export function createGmailClient(accessToken: string) {
//   const oAuth2 = new google.auth.OAuth2();
//   oAuth2.setCredentials({ access_token: accessToken });
//   return google.gmail({ version: 'v1', auth: oAuth2 });
// }

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;
// const isDev = process.env.NODE_ENV === 'development';

// first: if env var is set use it,
// otherwise pick DEV_URI vs PROD_URI based on isDev
// const GMAIL_REDIRECT_URI =
//   process.env.GMAIL_REDIRECT_URI ||
//   (isDev
//     ? "https://950566c6-5233-4cae-a6a7-76419744b973-00-1nm3ox732twro.picard.replit.dev/api/auth/gmail/callback"
//     : "https://recruitboost.io/api/auth/gmail/callback");

const GMAIL_REDIRECT_URI =
  process.env.GMAIL_REDIRECT_URI ||
 "https://recruitboost.io/api/auth/gmail/callback";

  
//https://recruitboost.io
//https://950566c6-5233-4cae-a6a7-76419744b973-00-1nm3ox732twro.picard.replit.dev/api/auth/gmail/callback
  // "https://recruitboost.io/api/auth/gmail/callback";
export function createGmailClientForUser(user: {
  gmailAccessToken: string;
  gmailRefreshToken: string;
  gmailTokenExpiry: number;
}) {
  const oAuth2 = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI,
  );

  oAuth2.setCredentials({
    access_token: user.gmailAccessToken,
    refresh_token: user.gmailRefreshToken,
    expiry_date: user.gmailTokenExpiry,
  });

  // This client will automatically use the refresh token to fetch a new access token
  return google.gmail({ version: "v1", auth: oAuth2 });
}

export function makeRawMessage(
  from: string,
  to: string,
  subject: string,
  body: string,
) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ];
  return base64url(lines.join("\n"));
}


/**
 * Recursively searches a message payload for a part whose base mime type matches.
 */
function findPart(
  payload: any,
  type: "text/plain" | "text/html",
): { data: string } | undefined {
  // strip off any ;charset=…
  const baseMime = payload.mimeType?.split(";")[0].trim();
  if (baseMime === type && payload.body?.data) {
    return payload.body;
  }
  if (Array.isArray(payload.parts)) {
    for (const p of payload.parts) {
      const found = findPart(p, type);
      if (found) return found;
    }
  }
  return undefined;
}

export function extractTextFromPayload(payload: any): string {
  // try text/plain first
  const textPart = findPart(payload, "text/plain");
  if (textPart) {
    return base64url.decode(textPart.data);
  }
  // fallback to stripping tags from html
  const htmlPart = findPart(payload, "text/html");
  if (htmlPart) {
    return base64url.decode(htmlPart.data).replace(/<[^>]+>/g, "");
  }
  return "";
}

export function extractHtmlFromPayload(payload: any): string {
  // prefer html
  const htmlPart = findPart(payload, "text/html");
  if (htmlPart) {
    return base64url.decode(htmlPart.data);
  }
  // otherwise wrap plain text in a <pre>
  const textPart = findPart(payload, "text/plain");
  if (textPart) {
    return `<pre>${base64url.decode(textPart.data)}</pre>`;
  }
  return "";
}

/**
 * Given a chunk of Gmail‐styled HTML, return only the “top” reply,
 * stripping out all Gmail quotes (the old thread).
 */
export function stripGmailQuote(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // 1) Remove any element with class="gmail_quote" or gmail_quote_container
  doc
    .querySelectorAll(".gmail_quote, .gmail_quote_container")
    .forEach((el) => el.remove());

  // 2) Remove any <blockquote> blocks
  doc.querySelectorAll("blockquote").forEach((el) => el.remove());

  // 3) Optionally remove the “On ... wrote:” line
  doc.querySelectorAll("div.gmail_attr").forEach((el) => el.remove());

  // 4) Return the inner HTML of the body (or a wrapping div)
  return doc.body.innerHTML.trim();
}

/**
 * Strip out everything below the “On ... wrote:” line
 * and any quoted lines (starting with ‘>’).
 */
export function stripEmailHistory(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // If we hit the attribution, stop processing entirely
    if (/^On .+ wrote:$/i.test(line)) {
      break;
    }

    // Skip quoted lines
    if (/^\s*>/.test(line)) {
      continue;
    }

    out.push(rawLine);
  }

  // Trim leading/trailing blank lines
  while (out.length && out[0].trim() === "") out.shift();
  while (out.length && out[out.length - 1].trim() === "") out.pop();

  return out.join("\n");
}
