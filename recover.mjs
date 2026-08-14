import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tftxdoedhnljtzivekay.supabase.co";
const supabaseKey = "sb_publishable_BFPGxOdEvC9xxA5T6wi4ow_4TEtToO9";

const supabase = createClient(supabaseUrl, supabaseKey);

async function recover() {
  const { data, error } = await supabase
    .from("sermons")
    .select("sync_key, title, updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching data:", error);
    return;
  }

  console.log("--- RECENT SERMONS ---");
  if (data.length === 0) {
    console.log("No sermons found in database.");
  }
  data.forEach((sermon) => {
    console.log(
      `Title: "${sermon.title}" | Sync Code: ${sermon.sync_key} | Updated: ${sermon.updated_at}`,
    );
  });
}

recover();
