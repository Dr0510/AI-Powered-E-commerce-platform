"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useSyncExternalStore, useCallback } from "react";

const themeListeners = new Set();

function subscribeToTheme(callback) {
  themeListeners.add(callback);
  return () => themeListeners.delete(callback);
}

function getThemeSnapshot() {
  if (typeof window === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export default function ClerkThemeProvider({ children, publishableKey }) {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => false,
  );

  const appearance = {
    baseTheme: isDark ? dark : undefined,
    variables: isDark
      ? {
          colorPrimary: "#2aa89a",
          colorBackground: "#181b22",
          colorInputBackground: "#1e2129",
          colorInputText: "#e8e4df",
          colorText: "#e8e4df",
          colorTextSecondary: "#b8b2a8",
          colorDanger: "#f7a0a0",
          colorNeutral: "#e8e4df",
          borderRadius: "12px",
          fontFamily: '"Inter", Aptos, "Segoe UI", Arial, Helvetica, sans-serif',
        }
      : {
          colorPrimary: "#123f3a",
          colorBackground: "#fffaf1",
          colorInputBackground: "#ffffff",
          colorInputText: "#171412",
          colorText: "#171412",
          colorTextSecondary: "#7c6a55",
          colorDanger: "#c94040",
          colorNeutral: "#171412",
          borderRadius: "12px",
          fontFamily: '"Inter", Aptos, "Segoe UI", Arial, Helvetica, sans-serif',
        },
    elements: isDark
      ? {
          card: { backgroundColor: "#181b22", borderColor: "#2a2e38", boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)" },
          rootBox: { colorScheme: "dark" },
          navbar: { backgroundColor: "#1e2129", borderRightColor: "#2a2e38" },
          headerTitle: { color: "#e8e4df" },
          headerSubtitle: { color: "#b8b2a8" },
          formFieldInput: { backgroundColor: "#1e2129", borderColor: "#333844", color: "#e8e4df" },
          formFieldLabel: { color: "#b8b2a8" },
          footer: { backgroundColor: "#1e2129", borderTopColor: "#2a2e38" },
          footerActionLink: { color: "#2aa89a" },
          userButtonPopoverCard: { backgroundColor: "#181b22", borderColor: "#2a2e38", boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)" },
          userButtonPopoverActionButton: { color: "#e8e4df" },
          userButtonPopoverFooter: { backgroundColor: "#1e2129", borderTopColor: "#2a2e38" },
          profileSection: { borderBottomColor: "#2a2e38" },
          profileSectionTitle: { color: "#b8b2a8", borderBottomColor: "#2a2e38" },
          dividerLine: { backgroundColor: "#2a2e38" },
          dividerText: { color: "#8a8278" },
          modalBackdrop: { backgroundColor: "rgba(0, 0, 0, 0.6)" },
          pageScrollBox: { backgroundColor: "#181b22" },
          page: { backgroundColor: "#181b22" },
        }
      : {
          card: { backgroundColor: "#fffaf1", borderColor: "#e3d7c7", boxShadow: "0 18px 50px rgba(42, 34, 24, 0.08)" },
          navbar: { backgroundColor: "#f4efe7", borderRightColor: "#e3d7c7" },
          footer: { backgroundColor: "#f4efe7", borderTopColor: "#e3d7c7" },
          formFieldInput: { backgroundColor: "#ffffff", borderColor: "#d8cbbb" },
          userButtonPopoverCard: { backgroundColor: "#fffaf1", borderColor: "#e3d7c7", boxShadow: "0 18px 50px rgba(42, 34, 24, 0.12)" },
          dividerLine: { backgroundColor: "#e3d7c7" },
          profileSection: { borderBottomColor: "#e3d7c7" },
          profileSectionTitle: { borderBottomColor: "#e3d7c7" },
        },
  };

  return (
    <ClerkProvider publishableKey={publishableKey} appearance={appearance}>
      {children}
    </ClerkProvider>
  );
}