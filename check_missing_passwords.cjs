const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';
const baseUrl = 'https://wuqqrcowznrmmuokfxlk.supabase.co/rest/v1';
const headers = { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` };

async function checkPasswords() {
  const res = await fetch(`${baseUrl}/users?select=username,passcode`, { headers });
  if (res.status !== 200) {
    console.error("HTTP error:", res.status);
    return;
  }
  const users = await res.json();
  console.log("Total users in production database:", users.length);
  const missingPasswordUsers = [];
  users.forEach(u => {
    if (!u.passcode || u.passcode.trim() === '') {
      missingPasswordUsers.push(u.username);
    }
  });

  if (missingPasswordUsers.length > 0) {
    console.log("USERS MISSING PASSWORD IN PRODUCTION:", missingPasswordUsers);
  } else {
    console.log("ALL PRODUCTION USERS HAVE A PASSWORD/PASSCODE CONFIGURED.");
  }
}
checkPasswords();
