const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const e = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString:
    'postgres://wpfxyyjg:Ysiz0SrjbiiYT-YDm9yArEns6x9RXQG3@peanut.db.elephantsql.com/wpfxyyjg',
});

app.get('/', (req, res) => {
  res.send('Welcome to Dating App'); // You can customize this response
});

//register USER
app.post('/register', async (req, res) => {
  const { username, password, personalInterests } = req.body;

  try {
    // Insert the user into the 'users' table
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, password]
    );

    // Extract the newly generated user ID
    const userId = newUser.rows[0].id;

    // Insert user's personal interests into the 'personal_interests' table
    if (Array.isArray(personalInterests)) {
      for (const personalInterest of personalInterests) {
        await pool.query(
          'INSERT INTO personal_interests (user_id, interest) VALUES ($1, $2)',
          [userId, personalInterest]
        );
      }
      res.status(201).json({ message: 'Registration successful' });
    } else {
      res.status(400).json({ error: 'personalInterests should be an array' });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

//LOGIN  --> test if user exists (for now, later check for password)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists in the database
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [
      username,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Authentication failed' });
    } else {
      res.json(user.rows[0]);
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/matches', async (req, res) => {
  res.sendFile(path.resolve(__dirname, '../src/components/Matches.jsx'));
});

// Searching for users with specific interests
app.get('/search', async (req, res) => {
  const { preference1, preference2, preference3 } = req.query;
  // console.log('query:', req.query);
  const interestArr = [preference1, preference2, preference3];

  const output = []
  try {
    const usersWithInterests = await pool.query(
      'SELECT users.username, personal_interests.interest FROM users JOIN personal_interests ON users.id = personal_interests.user_id WHERE personal_interests.interest = $1',
      [preference1]
    );
    const usersWithInterests2 = await pool.query(
      'SELECT users.username, personal_interests.interest FROM users JOIN personal_interests ON users.id = personal_interests.user_id WHERE personal_interests.interest = $1',
      [preference2]
    );
    // console.log("TWO",usersWithInterests2.rows)
    const usersWithInterests3 = await pool.query(
      'SELECT users.username, personal_interests.interest FROM users JOIN personal_interests ON users.id = personal_interests.user_id WHERE personal_interests.interest = $1',
      [preference3]
    );
    // console.log("THREE",usersWithInterests3.rows)

    for (let i = 0; i < usersWithInterests.rows.length; i++) {
      output.push(usersWithInterests.rows[i]);
    }
    console.log(output);
    for (let i = 0; i < usersWithInterests2.rows.length; i++) {
     output.push(usersWithInterests2.rows[i]);
    }
    console.log('2nd out', output);
    for (let i = 0; i < usersWithInterests3.rows.length; i++) {
      output.push(usersWithInterests3.rows[i]);
    }
    console.log('3rd out', output);
  
  const newOutput = [];

  for (obj of output) {

    let empty = true;
    for (newobj of newOutput) {
       if (obj.username == newobj.username) { empty = false; }
    }
    if (empty) {
        newOutput.push({username: obj.username, interest: obj.interest});
    } else {
        for (newobj of newOutput) {
           if (newobj.username == obj.username) {
               for (int of obj.interest) {
                 newobj.interest += `,` + int;
                }
           }  
        }
    }
}
 console.log("NEWOUTPT = " , newOutput)

    if (output.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    } else {
      fs.writeFileSync('./server/public/storage.txt', JSON.stringify(output));
      res.redirect('http://localhost:8080/');
    }
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
