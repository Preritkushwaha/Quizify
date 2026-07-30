const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      firebaseUid: "test-uid-123",
      email: "test@example.com"
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Error Response:", err.response.data);
    } else {
      console.error("Error Request:", err.message);
    }
  }
})();
