const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:AliRana28!%40@db.nfrexqvxdoljawmvyevz.supabase.co:5432/postgres"
});
console.log("Attempting to connect to Supabase at db.nfrexqvxdoljawmvyevz.supabase.co:5432...");
client.connect()
  .then(() => {
    console.log("SUCCESS: Connected to the database successfully!");
    client.end();
  })
  .catch(err => {
    console.error("FAILURE: Connection failed with error:", err.message);
  });
