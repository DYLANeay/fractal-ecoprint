const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the src directory
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Fractal EcoPrint server running at http://localhost:${PORT}`);
  console.log(`Serving files from ${path.join(__dirname, '..')}`);
});
