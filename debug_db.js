import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ljgm18070620@',
  database: 'party_joy_hub'
});

async function run() {
  try {
    const [games] = await pool.query('SELECT * FROM games');
    console.log('=== GAMES ===');
    console.table(games);

    const [questions] = await pool.query('SELECT * FROM questions');
    console.log('\n=== QUESTIONS ===');
    console.table(questions);
    
    // Check association
    if (games.length > 0) {
        const gameId = games[games.length - 1].id; // Last game
        console.log(`\nChecking questions for last game ID: "${gameId}"`);
        const [gameQuestions] = await pool.query('SELECT * FROM questions WHERE game_id = ?', [gameId]);
        console.log(`Found ${gameQuestions.length} questions for game ${gameId}`);
        if (gameQuestions.length > 0) {
            console.log('Sample Question:', gameQuestions[0]);
        }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();