import { ImageResponse } from "next/og";

export const alt = "Rechtsfall Check – Klarheit, bevor Sie entscheiden";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "76px",
          background: "linear-gradient(125deg,#061b2c,#0b3150)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 92, height: 104, borderRadius: 18, background: "#fff", position: "relative", display: "flex", flexDirection: "column", gap: 12, padding: "27px 20px" }}>
              <span style={{ width: 50, height: 7, borderRadius: 8, background: "#082A43" }} />
              <span style={{ width: 36, height: 7, borderRadius: 8, background: "#082A43" }} />
              <span style={{ position: "absolute", right: 0, bottom: 0, width: 34, height: 34, background: "#2868FF", clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
            </div>
            <div style={{ display: "flex", fontSize: 60, fontWeight: 800, letterSpacing: -3 }}>
              <span>Rechtsfall&nbsp;</span><span style={{ color: "#6F98FF" }}>Check</span>
            </div>
          </div>
          <div style={{ fontSize: 58, lineHeight: 1.03, fontWeight: 700, letterSpacing: -2, marginTop: 58 }}>
            Ihr Fall. Klar vorgeprüft.
          </div>
          <div style={{ fontSize: 25, color: "#c6d6e3", marginTop: 22 }}>
            Klarheit, bevor Sie entscheiden.
          </div>
        </div>
        <div style={{ width: 250, height: 320, border: "2px solid rgba(111,152,255,.45)", borderRadius: 34, background: "rgba(40,104,255,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 150, height: 182, borderRadius: 24, background: "#fff", display: "flex", flexDirection: "column", gap: 17, padding: "42px 29px", position: "relative" }}>
            <span style={{ width: 88, height: 10, borderRadius: 9, background: "#082A43" }} />
            <span style={{ width: 63, height: 10, borderRadius: 9, background: "#082A43" }} />
            <span style={{ position: "absolute", right: 0, bottom: 0, width: 58, height: 58, background: "#2868FF", clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
