import { supabase } from "@/integrations/supabase/client";
import seedData from "../../database_backup/seed_data.json";

let seeded = false;

export const seedDatabaseIfEmpty = async () => {
  if (seeded) return;
  seeded = true;

  try {
    const { count, error } = await supabase
      .from("incident_reports")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[Seed] Count check failed:", error);
      return;
    }

    if ((count ?? 0) > 0) return;

    console.log("[Seed] Database empty, inserting seed data...");
    const { error: insertErr } = await supabase
      .from("incident_reports")
      .insert(seedData.incident_reports as any);

    if (insertErr) {
      console.error("[Seed] Insert failed:", insertErr);
    } else {
      console.log(`[Seed] Inserted ${seedData.incident_reports.length} sample incidents`);
    }
  } catch (err) {
    console.error("[Seed] Error:", err);
  }
};
