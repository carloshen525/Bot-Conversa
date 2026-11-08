import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090a0f",
        foreground: "#f3f4f6",
        card: {
          DEFAULT: "#11131a",
          foreground: "#f3f4f6",
        },
        popover: {
          DEFAULT: "#151821",
          foreground: "#f3f4f6",
        },
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
          hover: "#4f46e5",
        },
        secondary: {
          DEFAULT: "#1e2230",
          foreground: "#cbd5e1",
        },
        muted: {
          DEFAULT: "#181b24",
          foreground: "#94a3b8",
        },
        accent: {
          DEFAULT: "#1e2230",
          foreground: "#f8fafc",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "#232736",
        input: "#1b1f2b",
        ring: "#6366f1",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
