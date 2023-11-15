const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

// Define a route for the root URL
app.get('/teams', async (req, res) => {
  const response = await axios.get("https://api.nhle.com/stats/rest/en/team");
  res.send(response.data.data);
});

app.get('/roster/:tricode', async (req, res) => {
  const { tricode } = req.params;
  const response = await axios.get(`https://api-web.nhle.com/v1/roster/${tricode}/20232024`);
  res.send(response.data);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
