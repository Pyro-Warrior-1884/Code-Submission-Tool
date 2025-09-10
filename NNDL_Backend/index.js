const express = require('express');
const cors = require('cors');
const db = require('./firebase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' })); 

app.post('/submit', async (req, res) => {
  console.log('🟡 Incoming submission:', req.body); 

  const { name, code, timestamp, status } = req.body;

  if (!name || !code || !timestamp || !status) {
    console.error('🔴 Missing fields:', { name, code, timestamp, status });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const docRef = db.collection('submissions').doc();
    await docRef.set({ name, code, timestamp, status });

    res.status(200).json({ message: 'Submission received and saved.' });
  } catch (err) {
    console.error('🔥 Error saving to Firebase:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/', (req, res) => {
  res.send('Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
