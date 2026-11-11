/**
 * Privacy gate for captures.
 *
 * The reference build ships demo fixtures that include realistic-looking
 * colleague names and @coamana.com addresses. None of that belongs in a public
 * film, so every capture is scanned and anything that matches is either
 * blanked in the DOM before the shot or reported as a blocking finding.
 */
import type { Page } from "playwright";

export type PrivacyFinding = {
  kind: "email" | "phone" | "token";
  value: string;
  selector: string | null;
};

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(?:\+?254|\+?234|\+)\d[\d\s-]{7,}\d/g;
const TOKEN = /\b(?:sk|pk|mv)_[A-Za-z0-9]{12,}\b/g;

/** Addresses that are published product contact points, not private data. */
const PUBLIC_ALLOWLIST = new Set(["marketview@coamana.com", "legal@coamana.com"]);

/**
 * Replaces personal identifiers in the live DOM with neutral placeholders.
 * Runs before screenshots so the pixels never contain the original value.
 */
export const redactDom = async (page: Page): Promise<number> => {
  return page.evaluate(
    ({ emailSrc, phoneSrc, tokenSrc, allow }) => {
      const email = new RegExp(emailSrc, "g");
      const phone = new RegExp(phoneSrc, "g");
      const token = new RegExp(tokenSrc, "g");
      let count = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let n = walker.nextNode();
      while (n) {
        nodes.push(n as Text);
        n = walker.nextNode();
      }
      for (const node of nodes) {
        const original = node.nodeValue ?? "";
        let next = original.replace(email, (m) => (allow.includes(m) ? m : "contact@example.com"));
        next = next.replace(phone, "+254 7•• ••• •••");
        next = next.replace(token, "mv_live_••••••••••••");
        if (next !== original) {
          node.nodeValue = next;
          count += 1;
        }
      }
      return count;
    },
    {
      emailSrc: EMAIL.source,
      phoneSrc: PHONE.source,
      tokenSrc: TOKEN.source,
      allow: Array.from(PUBLIC_ALLOWLIST),
    },
  );
};

/** Reports anything sensitive still visible after redaction. */
export const scanPage = async (page: Page): Promise<PrivacyFinding[]> => {
  return page.evaluate(
    ({ emailSrc, phoneSrc, tokenSrc, allow }) => {
      const text = document.body.innerText ?? "";
      const findings: { kind: "email" | "phone" | "token"; value: string; selector: null }[] = [];
      const push = (kind: "email" | "phone" | "token", src: string) => {
        for (const m of text.matchAll(new RegExp(src, "g"))) {
          if (kind === "email" && allow.includes(m[0])) continue;
          findings.push({ kind, value: m[0], selector: null });
        }
      };
      push("email", emailSrc);
      push("phone", phoneSrc);
      push("token", tokenSrc);
      return findings;
    },
    {
      emailSrc: EMAIL.source,
      phoneSrc: PHONE.source,
      tokenSrc: TOKEN.source,
      allow: Array.from(PUBLIC_ALLOWLIST),
    },
  );
};
