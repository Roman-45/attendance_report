/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ─── Surfaces ───
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",

        // ─── Brand (single accent — AUCA Navy) ───
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          light: "var(--brand-light)",
          foreground: "var(--brand-foreground)",
        },

        // ─── shadcn/ui compat ───
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        input: "var(--input)",
        "input-background": "var(--input-background)",
        "switch-background": "var(--switch-background)",
        "subtle-foreground": "var(--subtle-foreground)",
        ring: "var(--ring)",

        // ─── Status — attendance ───
        "status-present":        "var(--status-present)",
        "status-present-bg":     "var(--status-present-bg)",
        "status-present-border": "var(--status-present-border)",
        "status-absent":         "var(--status-absent)",
        "status-absent-bg":      "var(--status-absent-bg)",
        "status-absent-border":  "var(--status-absent-border)",
        "status-late":           "var(--status-late)",
        "status-late-bg":        "var(--status-late-bg)",
        "status-late-border":    "var(--status-late-border)",
        "status-excused":        "var(--status-excused)",
        "status-excused-bg":     "var(--status-excused-bg)",
        "status-excused-border": "var(--status-excused-border)",

        // ─── Status — module ───
        "status-draft":          "var(--status-draft)",
        "status-draft-bg":       "var(--status-draft-bg)",
        "status-draft-border":   "var(--status-draft-border)",
        "status-active":         "var(--status-active)",
        "status-active-bg":      "var(--status-active-bg)",
        "status-active-border":  "var(--status-active-border)",
        "status-closed":         "var(--status-closed)",
        "status-closed-bg":      "var(--status-closed-bg)",
        "status-closed-border":  "var(--status-closed-border)",

        // ─── Status — invitation ───
        "status-pending":    "var(--status-pending)",
        "status-pending-bg": "var(--status-pending-bg)",
        "status-accepted":   "var(--status-accepted)",
        "status-accepted-bg":"var(--status-accepted-bg)",

        // ─── Feedback ───
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        "success-bg": "var(--success-bg)",
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        "warning-bg": "var(--warning-bg)",
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
        },
        "info-bg": "var(--info-bg)",

        // ─── Sidebar ───
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },

        // ─── Charts ───
        "chart-1": "var(--chart-1)",
        "chart-2": "var(--chart-2)",
        "chart-3": "var(--chart-3)",
        "chart-4": "var(--chart-4)",
        "chart-5": "var(--chart-5)",
      },

      // Explicit borderColor entry so `border-border` resolves in v3
      // (avoids the `border` utility-collision issue we hit earlier).
      borderColor: {
        DEFAULT: "var(--border)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
      },

      borderRadius: {
        sm: "calc(var(--radius) - 2px)",
        md: "var(--radius)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 6px)",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      boxShadow: {
        sm:  "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md:  "var(--shadow-md)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
