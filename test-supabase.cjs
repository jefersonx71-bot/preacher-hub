const { createClient } = require("@supabase/supabase-js");

const url = "https://tftxdoedhnljtzivekay.supabase.co";
const key = "sb_publishable_BFPGxOdEvC9xxA5T6wi4ow_4TEtToO9";

const supabase = createClient(url, key);

async function run() {
  try {
    const { data, error } = await supabase.from("sermons").select("*").limit(1);
    console.log("RESULT DATA:", data);
    console.log("RESULT ERROR:", error);
  } catch (e) {
    console.error("CATASTROPHIC ERROR:", e);
  }
}

run();
