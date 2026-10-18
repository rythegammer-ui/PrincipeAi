import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

/** Default social share image for every page (pages can override with their own opengraph-image). */
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const host = new URL(absoluteUrl("/")).host;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0c0a1d",
          backgroundImage:
            "radial-gradient(circle at 85% 10%, rgba(122,90,248,0.55) 0%, rgba(12,10,29,0) 45%), radial-gradient(circle at 5% 100%, rgba(253,176,34,0.22) 0%, rgba(12,10,29,0) 40%), linear-gradient(135deg, #15122b 0%, #0c0a1d 60%)",
          color: "white",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(135deg, #7a5af8 0%, #6938ef 50%, #4a1fb8 100%)",
              boxShadow: "0 12px 30px rgba(105,56,239,0.45)",
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
              <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" opacity="0.7" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 38, letterSpacing: -0.5 }}>
            <span>Principe</span>
            <span style={{ color: "#fec84b", marginLeft: 10 }}>AI</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 84, lineHeight: 1.04, letterSpacing: -2.5, maxWidth: 980 }}>
            <span>Make AI work&nbsp;</span>
            <span style={{ color: "#fec84b" }}>for you.</span>
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#c9c5e0", maxWidth: 900, lineHeight: 1.35 }}>
            Practical AI courses, 1:1 coaching and done-with-you implementation — for your life and your business.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24, color: "#a7a2c4" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {site.tagline.split(". ").map((part, i, all) => (
              <span
                key={part}
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#e4e2f0",
                }}
              >
                {i < all.length - 1 ? `${part}.` : part}
              </span>
            ))}
          </div>
          <span>{host}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
