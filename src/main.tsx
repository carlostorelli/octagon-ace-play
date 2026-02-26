import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

// Apply site settings (title, description, favicon) from DB
supabase
  .from("site_settings")
  .select("key, value")
  .in("key", ["site_title", "site_description", "site_favicon_url"])
  .then(({ data }) => {
    if (!data) return;
    for (const { key, value } of data) {
      if (!value) continue;
      if (key === "site_title") document.title = value;
      if (key === "site_description") {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute("content", value);
      }
      if (key === "site_favicon_url") {
        let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = value;
      }
    }
  });

createRoot(document.getElementById("root")!).render(<App />);
