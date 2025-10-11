// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zgnkqgnznkdggtympkdr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbmtxZ256bmtkZ2d0eW1wa2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDM3NzQsImV4cCI6MjA3NDkxOTc3NH0.owJGzsJ8y5IhPHopdEsjy4McGgfG2o12hsJ42v4FwtA";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
