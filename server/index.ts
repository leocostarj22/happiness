import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for local development
    methods: ["GET", "POST"]
  }
});

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'party_joy_hub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize DB Schema
async function initDB() {
  try {
    const connection = await pool.getConnection();

    try {
      // Create games table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS games (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          mode VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'waiting',
          current_question_index INT DEFAULT 0,
          admin_id VARCHAR(36),
          show_results BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Schema check: games table checked/created');
    } catch (err: any) {
      console.log('Schema check games:', err.message);
    }

    try {
      // Create players table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS players (
          id VARCHAR(36) PRIMARY KEY,
          game_id VARCHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          avatar VARCHAR(255),
          score INT DEFAULT 0,
          connected BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY idx_game_player_name (game_id, name)
        )
      `);
      console.log('Schema check: players table checked/created');
    } catch (err: any) {
      console.log('Schema check players:', err.message);
    }

    try {
      // Create questions table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id VARCHAR(36) PRIMARY KEY,
          game_id VARCHAR(36) NOT NULL,
          text TEXT NOT NULL,
          options TEXT,
          correct_answer INT,
          use_players_as_options BOOLEAN DEFAULT FALSE,
          time_limit INT DEFAULT 30,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Schema check: questions table checked/created');
    } catch (err: any) {
      console.log('Schema check questions:', err.message);
    }

    try {
      // Create votes table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS votes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          game_id VARCHAR(36) NOT NULL,
          player_id VARCHAR(36) NOT NULL,
          question_id VARCHAR(36) NOT NULL,
          option_index INT,
          target_player_id VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Schema check: votes table checked/created');
    } catch (err: any) {
      console.log('Schema check votes:', err.message);
    }

    try {
      // Create admins table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Schema check: admins table checked/created');
    } catch (err: any) {
      console.log('Schema check admins:', err.message);
    }

    // Now run ALTER TABLEs for backward compatibility or updates
    try {
      // Check if show_results column exists, if not add it
      await connection.query('ALTER TABLE games ADD COLUMN show_results BOOLEAN DEFAULT FALSE');
    } catch (err: any) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('Schema check (alter games):', err.message);
    }

    try {
      // Add admin_id to games
      await connection.query('ALTER TABLE games ADD COLUMN admin_id VARCHAR(36)');
    } catch (err: any) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('Schema check (alter games admin_id):', err.message);
    }

    try {
      // Add created_at to questions
      await connection.query('ALTER TABLE questions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch (err: any) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('Schema check (alter questions):', err.message);
    }

    try {
      // Add unique index to players if missing (might fail if created above, which is fine)
      await connection.query('ALTER TABLE players ADD UNIQUE INDEX idx_game_player_name (game_id, name)');
    } catch (err: any) {
      if (err.code !== 'ER_DUP_KEYNAME' && err.code !== 'ER_DUP_ENTRY') {
        // console.log('Schema check index:', err.message); // Ignore if exists
      }
    }

    try {
      // Add created_at to players
      await connection.query('ALTER TABLE players ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch (err: any) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('Schema check (alter players):', err.message);
    }

    try {
      // Add target_player_id to votes
      await connection.query('ALTER TABLE votes ADD COLUMN target_player_id VARCHAR(255)');
    } catch (err: any) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.log('Schema check (alter votes):', err.message);
    }

    try {
      console.log('Running startup cleanup...');
      
      // 1. Reset all players to disconnected
      const [updateResult] = await connection.query('UPDATE players SET connected = 0');
      console.log(`Reset connection status for ${(updateResult as any).affectedRows} players`);
      
      // 2. Delete anonymous games (admin_id IS NULL or empty)
      const [anonGames] = await connection.query("SELECT id FROM games WHERE admin_id IS NULL OR admin_id = ''");
      const gameIds = (anonGames as any[]).map(g => g.id);
      
      if (gameIds.length > 0) {
        console.log(`Found ${gameIds.length} anonymous games to delete. IDs: ${gameIds.join(', ')}`);
        const placeholders = gameIds.map(() => '?').join(',');
        
        await connection.query(`DELETE FROM votes WHERE game_id IN (${placeholders})`, gameIds);
        await connection.query(`DELETE FROM players WHERE game_id IN (${placeholders})`, gameIds);
        await connection.query(`DELETE FROM questions WHERE game_id IN (${placeholders})`, gameIds);
        await connection.query(`DELETE FROM games WHERE id IN (${placeholders})`, gameIds);
        console.log('Anonymous games deleted successfully');
      } else {
        console.log('No anonymous games found to delete');
      }
      
      console.log('Cleanup complete');
    } catch (err: any) {
      console.error('Cleanup failed:', err.message);
    }

    connection.release();
  } catch (err) {
    console.error('Failed to initialize DB:', err);
  }
}
initDB();

// Test DB Connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    console.error('Please ensure MySQL is running and credentials in .env are correct.');
  });

// Helper to get full game state
async function getGameState(gameId: string) {
  const cleanId = gameId.trim();
  console.log(`[getGameState] Fetching state for game: "${cleanId}"`);
  
  const [games] = await pool.query('SELECT * FROM games WHERE id = ?', [cleanId]);
  const game = (games as any[])[0];
  if (!game) {
    console.log(`[getGameState] Game not found: "${cleanId}"`);
    return null;
  }

  const [questions] = await pool.query('SELECT * FROM questions WHERE game_id = ? ORDER BY created_at ASC', [cleanId]);
  const questionsList = questions as any[];
  console.log(`[getGameState] Game ${cleanId}: Fetched ${questionsList.length} questions`);
  if (questionsList.length > 0) {
    console.log('Sample question:', JSON.stringify(questionsList[0]));
  } else {
    console.log('WARNING: No questions found for game', cleanId);
  }

  const [players] = await pool.query('SELECT * FROM players WHERE game_id = ? ORDER BY created_at ASC', [cleanId]);
  const [votes] = await pool.query('SELECT * FROM votes WHERE game_id = ?', [cleanId]);

  // Recalculate scores for Voting mode to ensure consistency
  if (game.mode === 'voting') {
    const playersList = players as any[];
    const votesList = votes as any[];
    
    // Reset local scores map
    const playerScores = new Map<string, number>();
    playersList.forEach(p => playerScores.set(p.id, 0));

    // Tally votes based on target_player_id
    votesList.forEach(v => {
        if (v.target_player_id) {
             const current = playerScores.get(v.target_player_id) || 0;
             playerScores.set(v.target_player_id, current + 1);
        }
    });

    // Update players array with calculated scores and sync to DB
    playersList.forEach(p => {
        const newScore = playerScores.get(p.id) || 0;
        // Only update if changed
        if (p.score !== newScore) {
             p.score = newScore;
             pool.query('UPDATE players SET score = ? WHERE id = ?', [newScore, p.id]).catch(console.error);
        }
    });
  }

  if ((votes as any[]).length > 0) {
    console.log(`[getGameState] Found ${(votes as any[]).length} votes. Sample:`, JSON.stringify((votes as any[])[0]));
  }

  return {
    game: {
      id: game.id,
      name: game.name,
      mode: game.mode,
      status: game.status,
      currentQuestionIndex: game.current_question_index,
      questions: questionsList.map((q: any) => {
        try {
          const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          return { 
            id: q.id,
            text: q.text,
            options: Array.isArray(options) ? options : [],
            correctAnswer: q.correct_answer,
            timeLimit: q.time_limit || 30,
            usePlayersAsOptions: !!q.use_players_as_options
          };
        } catch (e) {
          console.error('Error parsing options for question:', q.id, e);
          return {
             id: q.id,
             text: q.text,
             options: [],
             correctAnswer: q.correct_answer,
             timeLimit: q.time_limit || 30,
             usePlayersAsOptions: !!q.use_players_as_options
          };
        }
      }),
    },
    players: (players as any[]).map((p: any) => ({
      ...p,
      connected: !!p.connected // Ensure boolean
    })),
    votes: (votes as any[]).map((v: any) => ({
      id: v.id,
      gameId: v.game_id,
      playerId: v.player_id,
      questionId: v.question_id,
      optionIndex: v.option_index,
      targetPlayerId: v.target_player_id,
      createdAt: v.created_at
    })),
    showResults: !!game.show_results
  };
}

// Track socket ownership for disconnection handling
const socketToPlayer = new Map<string, { gameId: string, playerId: string }>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', async () => {
    const info = socketToPlayer.get(socket.id);
    if (info) {
      const { gameId, playerId } = info;
      console.log(`Player ${playerId} disconnected from game ${gameId}`);
      await pool.query('UPDATE players SET connected = FALSE WHERE id = ?', [playerId]);
      socketToPlayer.delete(socket.id);
      
      const state = await getGameState(gameId);
      if (state) {
        io.to(gameId).emit('gameStateUpdate', state);
      }
    }
  });

  socket.on('leaveGame', async ({ gameId, playerId }) => {
    try {
      await pool.query('DELETE FROM players WHERE id = ?', [playerId]);
      const state = await getGameState(gameId);
      io.to(gameId).emit('gameStateUpdate', state);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('adminRegister', async (data, callback) => {
    try {
      // Validate input
      const result = registerSchema.safeParse(data);
      if (!result.success) {
        return callback({ success: false, error: result.error.errors[0].message });
      }

      const { email, password } = result.data;

      // Check if email exists
      const [existing] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
      if ((existing as any[]).length > 0) {
        return callback({ success: false, error: 'Este email já está cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const adminId = randomUUID();
      
      await pool.query(
        'INSERT INTO admins (id, email, password_hash) VALUES (?, ?, ?)',
        [adminId, email, hashedPassword]
      );
      
      const token = jwt.sign({ id: adminId, email }, JWT_SECRET, { expiresIn: '24h' });
      callback({ success: true, token, admin: { id: adminId, email } });
    } catch (err: any) {
      console.error('Register error:', err);
      callback({ success: false, error: 'Erro ao criar conta. Tente novamente.' });
    }
  });

  socket.on('adminLogin', async (data, callback) => {
    try {
      // Validate input
      const result = loginSchema.safeParse(data);
      if (!result.success) {
        return callback({ success: false, error: result.error.errors[0].message });
      }

      const { email, password } = result.data;

      const [admins] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
      const admin = (admins as any[])[0];
      
      if (!admin || !await bcrypt.compare(password, admin.password_hash)) {
        return callback({ success: false, error: 'Credenciais inválidas' });
      }

      const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });
      callback({ success: true, token, admin: { id: admin.id, email: admin.email } });
    } catch (err) {
      console.error('Login error:', err);
      callback({ success: false, error: 'Erro no servidor. Tente novamente.' });
    }
  });

  socket.on('getAdminGames', async ({ token }, callback) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const [games] = await pool.query('SELECT * FROM games WHERE admin_id = ? ORDER BY created_at DESC', [decoded.id]);
      callback({ success: true, games });
    } catch (err) {
      callback({ success: false, error: 'Invalid token' });
    }
  });

  socket.on('deleteGame', async ({ gameId, token }, callback) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      // Verify ownership
      const [games] = await pool.query('SELECT * FROM games WHERE id = ? AND admin_id = ?', [gameId, decoded.id]);
      if ((games as any[]).length === 0) {
        return callback({ success: false, error: 'Not authorized or game not found' });
      }

      await pool.query('DELETE FROM votes WHERE game_id = ?', [gameId]);
      await pool.query('DELETE FROM questions WHERE game_id = ?', [gameId]);
      await pool.query('DELETE FROM players WHERE game_id = ?', [gameId]);
      await pool.query('DELETE FROM games WHERE id = ?', [gameId]);
      
      callback({ success: true });
    } catch (err) {
      console.error(err);
      callback({ success: false, error: 'Server error' });
    }
  });

  socket.on('resetGame', async ({ gameId, token }, callback) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      // Verify ownership
      const [games] = await pool.query('SELECT * FROM games WHERE id = ? AND admin_id = ?', [gameId, decoded.id]);
      if ((games as any[]).length === 0) {
        return callback({ success: false, error: 'Not authorized or game not found' });
      }

      // Reset game state
      await pool.query('DELETE FROM votes WHERE game_id = ?', [gameId]);
      await pool.query('DELETE FROM players WHERE game_id = ?', [gameId]);
      await pool.query('UPDATE games SET status = ?, current_question_index = ?, show_results = ? WHERE id = ?', ['waiting', 0, false, gameId]);
      
      const state = await getGameState(gameId);
      io.to(gameId).emit('gameStateUpdate', state);
      callback({ success: true });
    } catch (err) {
      console.error(err);
      callback({ success: false, error: 'Server error' });
    }
  });

  socket.on('createGame', async ({ name, mode, token }) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    let adminId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        adminId = decoded.id;
      } catch (e) {
        console.log('Invalid token provided for createGame');
      }
    }

    try {
      await pool.query(
        'INSERT INTO games (id, name, mode, status, current_question_index, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
        [gameId, name, mode, 'waiting', 0, adminId]
      );
      socket.join(gameId);
      socket.emit('gameCreated', { gameId, name, mode });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('addQuestion', async ({ gameId, question }) => {
    const questionId = Math.random().toString(36).substring(2, 9);
    try {
      await pool.query(
        'INSERT INTO questions (id, game_id, text, options, correct_answer, use_players_as_options) VALUES (?, ?, ?, ?, ?, ?)',
        [
          questionId,
          gameId,
          question.text,
          JSON.stringify(question.options),
          question.correctAnswer,
          question.usePlayersAsOptions || false
        ]
      );
      const state = await getGameState(gameId);
      io.to(gameId).emit('gameStateUpdate', state);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('removeQuestion', async ({ gameId, questionId }) => {
    try {
      await pool.query('DELETE FROM questions WHERE id = ?', [questionId]);
      const state = await getGameState(gameId);
      io.to(gameId).emit('gameStateUpdate', state);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('joinGame', async ({ gameId, playerName, avatar }) => {
    const cleanGameId = gameId ? gameId.trim() : '';
    const cleanPlayerName = playerName ? playerName.trim() : '';

    try {
      const [games] = await pool.query('SELECT * FROM games WHERE id = ?', [cleanGameId]);
      if ((games as any[]).length === 0) {
        socket.emit('error', 'Game not found');
        return;
      }
    
      const game = (games as any[])[0];
      
      if (game.status === 'finished') {
        socket.emit('error', 'O jogo já foi finalizado.');
        return;
      }
    
      // Helper to handle player connection/reconnection
      const connectPlayer = async (player: any) => {
        // Always update connection status (Force Reconnect)
        await pool.query('UPDATE players SET connected = TRUE WHERE id = ?', [player.id]);
        
        socketToPlayer.set(socket.id, { gameId: cleanGameId, playerId: player.id });
        socket.join(cleanGameId);

        const playerData = {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          score: player.score,
          connected: true
        };

        socket.emit('playerJoined', playerData);
        
        const state = await getGameState(cleanGameId);
        io.to(cleanGameId).emit('gameStateUpdate', state);
      };

      // 1. Try to find existing player
      const [existingPlayers] = await pool.query(
        'SELECT * FROM players WHERE game_id = ? AND name = ?',
        [cleanGameId, cleanPlayerName]
      );
      
      const existingPlayer = (existingPlayers as any[])[0];

      if (existingPlayer) {
        await connectPlayer(existingPlayer);
        return;
      }
    
      // 2. If not found, try to insert (with unique constraint handling)
      const playerId = Math.random().toString(36).substring(2, 9);
      try {
        await pool.query(
          'INSERT INTO players (id, game_id, name, avatar, score, connected) VALUES (?, ?, ?, ?, ?, ?)',
          [playerId, cleanGameId, cleanPlayerName, avatar, 0, true]
        );
        
        // Success - connect the new player
        await connectPlayer({
          id: playerId,
          name: cleanPlayerName,
          avatar,
          score: 0
        });

      } catch (err: any) {
        // 3. If duplicate entry error, it means race condition occurred -> fetch and connect
        if (err.code === 'ER_DUP_ENTRY') {
           const [retryPlayers] = await pool.query(
            'SELECT * FROM players WHERE game_id = ? AND name = ?',
            [cleanGameId, cleanPlayerName]
          );
          const retryPlayer = (retryPlayers as any[])[0];
          if (retryPlayer) {
            await connectPlayer(retryPlayer);
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('startGame', async ({ gameId }) => {
    await pool.query('UPDATE games SET status = ? WHERE id = ?', ['playing', gameId]);
    const state = await getGameState(gameId);
    io.to(gameId).emit('gameStateUpdate', state);
  });

  socket.on('openLobby', async ({ gameId }) => {
    await pool.query('UPDATE games SET status = ? WHERE id = ?', ['lobby', gameId]);
    const state = await getGameState(gameId);
    io.to(gameId).emit('gameStateUpdate', state);
  });

  socket.on('requestState', async ({ gameId }) => {
    const cleanId = gameId ? gameId.trim() : '';
    socket.join(cleanId);
    const state = await getGameState(cleanId);
    if (state) {
      socket.emit('gameStateUpdate', state);
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  socket.on('submitVote', async ({ gameId, playerId, questionId, optionIndex, targetPlayerId }) => {
    // Check if already voted
    const [existing] = await pool.query(
      'SELECT id FROM votes WHERE player_id = ? AND question_id = ?',
      [playerId, questionId]
    );

    if ((existing as any[]).length === 0) {
      // Get game mode and question to check answer
      const [games] = await pool.query('SELECT mode FROM games WHERE id = ?', [gameId]);
      const [questions] = await pool.query('SELECT correct_answer FROM questions WHERE id = ?', [questionId]);
      
      const gameMode = (games as any[])[0]?.mode;
      const correctAnswer = (questions as any[])[0]?.correct_answer;

      // Calculate score if quiz mode
      if (gameMode === 'quiz' && correctAnswer === optionIndex) {
        await pool.query('UPDATE players SET score = score + 100 WHERE id = ?', [playerId]);
      }
      // Calculate score if voting mode (Points for the person receiving the vote)
      else if (gameMode === 'voting' && targetPlayerId) {
        await pool.query('UPDATE players SET score = score + 1 WHERE id = ?', [targetPlayerId]);
      }

      await pool.query(
        'INSERT INTO votes (game_id, player_id, question_id, option_index, target_player_id) VALUES (?, ?, ?, ?, ?)',
        [gameId, playerId, questionId, optionIndex, targetPlayerId || null]
      );
      
      // Get player info for animation
      const [players] = await pool.query('SELECT name, avatar FROM players WHERE id = ?', [playerId]);
      const player = (players as any[])[0];

      const state = await getGameState(gameId);
      io.to(gameId).emit('gameStateUpdate', state);
      
      // Emit vote event for dashboard animation
      if (player) {
        io.to(gameId).emit('voteCast', {
          playerId,
          name: player.name,
          avatar: player.avatar
        });
      }
    }
  });

  socket.on('showQuestionResults', async ({ gameId }) => {
    try {
      await pool.query('UPDATE games SET show_results = TRUE WHERE id = ?', [gameId]);
      const state = await getGameState(gameId);
      io.to(gameId).emit('gameStateUpdate', state);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('nextQuestion', async ({ gameId }) => {
    try {
      // Get current state to check limits
      const [games] = await pool.query('SELECT current_question_index FROM games WHERE id = ?', [gameId]);
      const [questions] = await pool.query('SELECT COUNT(*) as count FROM questions WHERE game_id = ?', [gameId]);
      
      const currentIndex = (games as any[])[0]?.current_question_index || 0;
      const totalQuestions = (questions as any[])[0]?.count || 0;

      if (currentIndex + 1 >= totalQuestions) {
        // Game Finished
        await pool.query('UPDATE games SET status = ?, show_results = FALSE WHERE id = ?', ['finished', gameId]);
      } else {
        // Next Question
        await pool.query('UPDATE games SET current_question_index = current_question_index + 1, show_results = FALSE WHERE id = ?', [gameId]);
      }

      const state = await getGameState(gameId);
      io.to(gameId).emit('gameStateUpdate', state);
    } catch (err) {
      console.error(err);
    }
  });

  // Sync request
  socket.on('requestState', async ({ gameId }) => {
    const state = await getGameState(gameId);
    if (state) {
      socket.join(gameId);
      socket.emit('gameStateUpdate', state);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});