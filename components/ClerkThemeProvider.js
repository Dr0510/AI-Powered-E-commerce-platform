"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useEffect, useState } from "react";

/**
 * Client-side ClerkProvider wrapper that dynamically switches
 * between light and dark Clerk themes based on the `data-theme`
 * attribute on <html>. This replaces all structural CSS overrides
 * for Clerk components.
 */
export default function ClerkThemeProvider({ children, publishableKey }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    /* Read the initial theme */
    const root = document.documentElement;
    setIsDark(root.getAttribute("data-theme") === "dark");

    /* Watch for changes (our ThemeToggle sets this attribute) */
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "data-theme") {
          setIsDark(root.getAttribute("data-theme") === "dark");
        }
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  /* Clerk appearance configuration — works for ALL Clerk components */
  const appearance = {
    baseTheme: isDark ? dark : undefined,
    variables: isDark
      ? {
          /* Dark mode tokens — match your design system */
          colorPrimary: "#2aa89a",
          colorBackground: "#181b22",
          colorInputBackground: "#1e2129",
          colorInputText: "#e8e4df",
          colorText: "#e8e4df",
          colorTextSecondary: "#b8b2a8",
          colorDanger: "#f7a0a0",
          colorNeutral: "#e8e4df",
          borderRadius: "12px",
          fontFamily:
            '"Inter", Aptos, "Segoe UI", Arial, Helvetica, sans-serif',
        }
      : {
          /* Light mode tokens */
          colorPrimary: "#123f3a",
          colorBackground: "#fffaf1",
          colorInputBackground: "#ffffff",
          colorInputText: "#171412",
          colorText: "#171412",
          colorTextSecondary: "#7c6a55",
          colorDanger: "#c94040",
          colorNeutral: "#171412",
          borderRadius: "12px",
          fontFamily:
            '"Inter", Aptos, "Segoe UI", Arial, Helvetica, sans-serif',
        },
    elements: isDark
      ? {
          /* Dark mode element overrides */
          card: {
            backgroundColor: "#181b22",
            borderColor: "#2a2e38",
            boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
          },
          rootBox: {
            colorScheme: "dark",
          },
          navbar: {
            backgroundColor: "#1e2129",
            borderRightColor: "#2a2e38",
          },
          navbarButton: {
            color: "#b8b2a8",
            "&:hover": { backgroundColor: "#242832" },
          },
          navbarButtonActive: {
            backgroundColor: "#242832",
            color: "#2aa89a",
          },
          headerTitle: { color: "#e8e4df" },
          headerSubtitle: { color: "#b8b2a8" },
          socialButtonsIconButton: {
            backgroundColor: "#1e2129",
            borderColor: "#2a2e38",
            "&:hover": { backgroundColor: "#242832" },
          },
          formFieldInput: {
            backgroundColor: "#1e2129",
            borderColor: "#333844",
            color: "#e8e4df",
          },
          formFieldLabel: { color: "#b8b2a8" },
          footer: {
            backgroundColor: "#1e2129",
            borderTopColor: "#2a2e38",
          },
          footerActionLink: { color: "#2aa89a" },
          userPreview: {
            backgroundColor: "transparent",
          },
          userPreviewMainIdentifier: { color: "#e8e4df" },
          userPreviewSecondaryIdentifier: { color: "#b8b2a8" },
          userButtonPopoverCard: {
            backgroundColor: "#181b22",
            borderColor: "#2a2e38",
            boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
          },
          userButtonPopoverActionButton: {
            color: "#e8e4df",
            "&:hover": { backgroundColor: "#1e2129" },
          },
          userButtonPopoverActionButtonIcon: { color: "#b8b2a8" },
          userButtonPopoverFooter: {
            backgroundColor: "#1e2129",
            borderTopColor: "#2a2e38",
          },
          profileSection: { borderBottomColor: "#2a2e38" },
          profileSectionTitle: { color: "#b8b2a8", borderBottomColor: "#2a2e38" },
          profileSectionContent: { color: "#e8e4df" },
          accordionTriggerButton: { color: "#e8e4df" },
          badge: {
            backgroundColor: "rgba(42, 168, 154, 0.15)",
            color: "#2aa89a",
          },
          tagInputContainer: {
            backgroundColor: "#1e2129",
            borderColor: "#333844",
          },
          menuButton: {
            color: "#e8e4df",
            "&:hover": { backgroundColor: "#242832" },
          },
          menuItem: {
            "&:hover": { backgroundColor: "#242832" },
          },
          dividerLine: { backgroundColor: "#2a2e38" },
          dividerText: { color: "#8a8278" },
          identityPreview: {
            backgroundColor: "#1e2129",
            borderColor: "#2a2e38",
          },
          identityPreviewText: { color: "#b8b2a8" },
          identityPreviewEditButton: { color: "#2aa89a" },
          otpCodeFieldInput: {
            backgroundColor: "#1e2129",
            borderColor: "#333844",
            color: "#e8e4df",
          },
          formResendCodeLink: { color: "#2aa89a" },
          alert: {
            backgroundColor: "#1e2129",
            borderColor: "#333844",
          },
          alertText: { color: "#e8e4df" },
          selectButton: {
            backgroundColor: "#1e2129",
            borderColor: "#333844",
            color: "#e8e4df",
          },
          selectOptionsContainer: {
            backgroundColor: "#181b22",
            borderColor: "#2a2e38",
          },
          selectOption: {
            color: "#e8e4df",
            "&:hover": { backgroundColor: "#242832" },
          },
          modalBackdrop: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
          scrollBox: {
            backgroundColor: "#181b22",
          },
          pageScrollBox: {
            backgroundColor: "#181b22",
          },
          page: {
            backgroundColor: "#181b22",
          },
        }
      : {
          /* Light mode element overrides */
          card: {
            backgroundColor: "#fffaf1",
            borderColor: "#e3d7c7",
            boxShadow: "0 18px 50px rgba(42, 34, 24, 0.08)",
          },
          navbar: {
            backgroundColor: "#f4efe7",
            borderRightColor: "#e3d7c7",
          },
          footer: {
            backgroundColor: "#f4efe7",
            borderTopColor: "#e3d7c7",
          },
          socialButtonsIconButton: {
            backgroundColor: "#ffffff",
            borderColor: "#d8cbbb",
          },
          formFieldInput: {
            backgroundColor: "#ffffff",
            borderColor: "#d8cbbb",
          },
          userButtonPopoverCard: {
            backgroundColor: "#fffaf1",
            borderColor: "#e3d7c7",
            boxShadow: "0 18px 50px rgba(42, 34, 24, 0.12)",
          },
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
