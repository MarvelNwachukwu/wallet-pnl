import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "Courier New", "monospace"],
      },
      colors: {
        terminal: {
          base: "#07080F",
          surface: "#0C0E1A",
          elevated: "#111425",
          border: "rgba(255,255,255,0.06)",
          "border-bright": "rgba(255,255,255,0.12)",
        },
        amber: {
          glow: "#FFB800",
          dim: "rgba(255,184,0,0.12)",
          border: "rgba(255,184,0,0.3)",
        },
        profit: {
          DEFAULT: "#00D68F",
          dim: "rgba(0,214,143,0.1)",
          border: "rgba(0,214,143,0.3)",
        },
        loss: {
          DEFAULT: "#FF3B5C",
          dim: "rgba(255,59,92,0.1)",
          border: "rgba(255,59,92,0.3)",
        },
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        blink: "blink 1.1s step-end infinite",
        shimmer: "shimmer 2s linear infinite",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        scan: "scan 8s linear infinite",
        pulse: "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
