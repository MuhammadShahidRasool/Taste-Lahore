const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseClient = null;
let supabaseConfigError = null;

if (!supabaseUrl || !supabaseServiceKey) {
  supabaseConfigError = 'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env';
} else {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
}

module.exports = {
  supabaseClient,
  supabaseConfigError
};