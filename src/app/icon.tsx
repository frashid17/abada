import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** App favicon — legal scales mark on navy. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1F33",
          borderRadius: 6,
          color: "#FFFFFF",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        ⚖
      </div>
    ),
    size,
  );
}
