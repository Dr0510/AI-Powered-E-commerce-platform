import { Inter } from "next/font/google";
import "./globals.css";
import ClerkThemeProvider from "../components/ClerkThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "DR MART by DR Group | Premium Commerce",
  description: "A premium multi-category commerce experience from DR MART by DR Group, with curated sellers, fast checkout, and refined order tracking.",
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem("dr-theme");
    if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme:dark)").matches)) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }) {
  const content = (
    <html lang="en" className={`h-full antialiased ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`min-h-full flex flex-col ${inter.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return content;
  }

  return (
    <ClerkThemeProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {content}
    </ClerkThemeProvider>
  );
}