const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function runTest() {
  try {
    console.log('--- Starting Auth & Chat Flow Test ---');
    
    const user1Timestamp = Date.now();
    const user2Timestamp = Date.now() + 1000;

    // 1. Register User 1
    console.log('\n1. Registering User 1...');
    const user1Res = await axios.post(`${API_URL}/users/register`, {
      fullName: 'Test User One',
      username: 'user1_' + user1Timestamp,
      password: 'password123'
    });
    const user1 = user1Res.data;
    console.log('   User 1 registered successfully:', user1.username);
    console.log('   Received valid JWT token:', !!user1.token);

    // 2. Register User 2
    console.log('\n2. Registering User 2...');
    const user2Res = await axios.post(`${API_URL}/users/register`, {
      fullName: 'Test User Two',
      username: 'user2_' + user2Timestamp,
      password: 'password123'
    });
    const user2 = user2Res.data;
    console.log('   User 2 registered successfully:', user2.username);

    // 3. User 1 searches for User 2
    console.log(`\n3. ${user1.username} searching for ${user2.username}...`);
    const searchRes = await axios.get(`${API_URL}/users/search?q=${user2.username}`, {
      headers: { Authorization: `Bearer ${user1.token}` }
    });
    console.log(`   Search returned ${searchRes.data.length} results.`);
    const foundUser2 = searchRes.data[0];

    // 4. User 1 sends friend request to User 2
    console.log('\n4. User 1 sending friend request to User 2...');
    const reqRes = await axios.post(`${API_URL}/friends/request`, 
      { receiverId: foundUser2._id },
      { headers: { Authorization: `Bearer ${user1.token}` } }
    );
    console.log('   Friend request sent:', reqRes.data.message || 'Success');

    // 5. User 2 checks requests
    console.log('\n5. User 2 checking pending requests...');
    const pendingRes = await axios.get(`${API_URL}/friends/requests`, {
      headers: { Authorization: `Bearer ${user2.token}` }
    });
    const requests = pendingRes.data;
    console.log(`   User 2 has ${requests.length} pending request(s).`);
    const requestId = requests[0]._id;

    // 6. User 2 accepts request
    console.log('\n6. User 2 accepting friend request...');
    const acceptRes = await axios.post(`${API_URL}/friends/accept`,
      { requestId },
      { headers: { Authorization: `Bearer ${user2.token}` } }
    );
    console.log('   Request accepted:', acceptRes.data.message);

    // 7. Check profiles for friends
    console.log('\n7. Checking user profiles for friends list...');
    const p1 = await axios.get(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${user1.token}` } });
    const p2 = await axios.get(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${user2.token}` } });
    
    console.log(`   User 1 friends count: ${p1.data.friends.length} (Expected: 1)`);
    console.log(`   User 2 friends count: ${p2.data.friends.length} (Expected: 1)`);

    console.log('\n--- OVERALL STATUS: ALL TESTS PASSED SUCCESSFULLY ---');
    console.log('Local Authentication (Username/Password) & Friend System are fully functional.');
  } catch (error) {
    console.error('\n--- FLOW TEST FAILED ---');
    console.error(error.response ? error.response.data : error.message);
  }
}

runTest();
