const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const e = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString:
    "postgres://wpfxyyjg:Ysiz0SrjbiiYT-YDm9yArEns6x9RXQG3@peanut.db.elephantsql.com/wpfxyyjg",
});

app.get("/", (req, res) => {
  res.send("Welcome to Dating App"); // You can customize this response
});

//register USER
app.post("/register", async (req, res) => {
  const { username, password, personalInterests } = req.body;

  try {
    // Insert the user into the 'users' table
    const newUser = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, password]
    );

    // Extract the newly generated user ID
    const userId = newUser.rows[0].id;

    // Insert user's personal interests into the 'personal_interests' table
    if (Array.isArray(personalInterests)) {
      for (const personalInterest of personalInterests) {
        await pool.query(
          "INSERT INTO personal_interests (user_id, interest) VALUES ($1, $2)",
          [userId, personalInterest]
        );
      }
      res.status(201).json({ message: "Registration successful" });
    } else {
      res.status(400).json({ error: "personalInterests should be an array" });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

//global error handler
app.use((err, req, res, next) => {
  const defaultErr = {
    log: "Express error handler caught unknown middleware error",
    status: 500,
    message: { err: "An error occurred" },
  };
  const errorObj = Object.assign(defaultErr, err);
  console.log(errorObj.log);
  res.status(errorObj.status).send(errorObj.message);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
