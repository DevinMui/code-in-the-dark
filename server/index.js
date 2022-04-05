const express = require("express");
const path = require("path");
const cors = require("cors");
const HashMap = require("hashmap");
const crypto = require("crypto");
const challenge = require("./challenge");
const colors = require("./colors");
const starterCode = require("./starter-code");
const app = express();

let games = new HashMap();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/*
games
{
    "id": {
        id: string,
        players:[
            {
                "name": string,
                "uid": string,
                "code": string,
                "ready": bool,
                "votes": int
            }
        ],
        time: Date,
        started: bool,
        phase: Enum,
        image: string,
        assets: [string],
        game_duration: int, ms
        voting_duration: int, ms
    }
}
*/

const PHASE = {
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  VOTING: "VOTING",
  FINISHED: "FINISHED",
};

app.get("/game/:id", (req, res) => {
  if (!games.has(req.params.id))
    return res.json({
      success: false,
    });
  return res.json({
    id: req.params.id,
    success: true,
    ...games.get(req.params.id),
  });
});

app.get("/game/:id/:uid/sign-out", (req, res) => {
  // Should prevent arbitrary people from signing others out
  const game = games.get(req.params.id);
  if (game) {
    const arr = game.players.filter((p) => p.uid === req.params.uid);
    if (arr.length === game.players.length) return res.json({ success: false });
    if (arr.length) {
      game.players = arr;
      game.set(req.params.id, game);
    } else {
      games.delete(req.params.id);
    }
    return res.json({ success: false });
  }
});

// create game
app.post("/game", (req, res) => {
  // generate unique id
  const size = 4;
  let id;
  do {
    id = crypto.randomBytes(size).toString("hex").slice(0, size).toUpperCase();
  } while (games.has(id));

  games.set(id, {
    players: [],
    time: new Date(),
    started: false,
    phase: PHASE.WAITING,
    game_duration: req.body.game_duration || 15 * 60 * 1000,
    voting_duration: req.body.voting_duration || 1 * 60 * 1000,
  });

  console.log(
    `Game ${id} created with play duration: ${req.body.game_duration} and voting duration: ${req.body.voting_duration}.`
  );

  res.json({ id, ...games.get(id), success: true });
});

if (process.env.NODE_ENV === "production") {
  // Serve React production bundle
  app.use(express.static(path.join(__dirname, "build")));
  app.get("/*", (_, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });
} else {
  app.get("/debug", (_, res) => res.json(games));
  app.get("/", (_, res) => {
    res.json({ message: "hello world!" });
  });
}

const server = app.listen(PORT, () =>
  console.log(`server started on port ${PORT}`)
);
const io = require("socket.io")(server, { origins: "*:*" });

/* Socket.io logic
 *
 */
io.on("connection", (socket) => {
  socket.on("join", (player) => {
    /* player data expected in the form of 
        {
            "gameId": string,
            "name": string,
            "uid": string,
            "code": string,
            "ready": bool 
            "votes": int
            "color": color
        }
        */
    const room_size = 8;
    const { gameId } = player;
    if (!games.has(gameId))
      return socket.emit("error", { error: "The game does not exist" });

    const game = games.get(gameId);
    if (game.started)
      return socket.emit("error", { error: "The game has already started" });

    if (game.players.length >= room_size)
      return socket.emit("error", { error: "The game room is full" });

    if (game.players.find((p) => p.name === player.name))
      return socket.emit("error", {
        error: "Someone with the same name exists in the room",
      });

    const player_object = {
      gameId,
      name: player.name,
      uid: socket.id,
      code: starterCode,
      ready: false,
      votes: 0,
      color: colors[game.players.length],
    };

    console.log(`${player.name} has joined game ${gameId}.`);
    game.players.push(player_object);
    socket.join(`/game/${gameId}`);
    io.in("/game/" + gameId).emit("join", game);
    io.in("/game/" + gameId + "/spectate").emit("join", game);
  });

  // spectators
  socket.on("spectate", (game) => {
    /*
     * {
     *      id: string
     * }
     * */
    if (!games.has(game.id))
      return socket.emit("error", {
        error: "The game doesn't exist!",
      });
    console.log(`Someone has started spectating game ${game.id}.`);
    socket.join(`/game/${game.id}/spectate`);

    socket.emit("code", games.get(game.id));
  });

  socket.on("code update", (player) => {
    /* player code expected in the form of 
        {
            "gameId": string, 
            "uid": string,
            "code": string
        }
        */
    const { gameId } = player;
    if (!games.has(gameId))
      return socket.emit("error", {
        error: "The game does not exist!",
      });

    const game = games.get(gameId);

    if (game.phase !== PHASE.PLAYING)
      return socket.emit("error", {
        error: "The game is stopped",
      });

    const current_players = game.players;
    for (let i = 0; i < current_players.length; i++) {
      if (current_players[i].uid === player.uid) {
        game.players[i].code = player.code;
        break;
      }
    }
    io.in("/game/" + gameId).emit("code update", game);
    io.in("/game/" + gameId + "/spectate").emit("code update", game);
  });

  socket.on("unready", (player) => {
    const { gameId } = player;
    if (!games.has(gameId))
      return socket.emit("error", {
        error: "The game does not exist!",
      });

    const game = games.get(gameId);

    if (game.phase !== PHASE.WAITING)
      return socket.emit("error", {
        error: "The game has already started",
      });

    for (const p of game.players) {
      if (p.uid === player.uid) {
        p.ready = false;
        break;
      }
    }

    console.log(`${player.name} has unreadied in game ${gameId}.`);

    io.in("/game/" + gameId).emit("unready", game);
    io.in("/game/" + gameId + "/spectate").emit("code", game);
  });

  socket.on("ready", (player) => {
    /* msg expected in the form of 
        {
            "gameId": string, // game
            "uid": string,
            "ready": bool
        }
        */
    const { gameId } = player;
    if (!games.has(gameId))
      return socket.emit("error", {
        error: "The game does not exist!",
      });

    const game = games.get(gameId);

    if (game.phase !== PHASE.WAITING)
      return socket.emit("error", {
        error: "The game has already started",
      });

    const current_players = game.players;
    let shouldStart = true;
    for (let i = 0; i < current_players.length; i++) {
      if (current_players[i].uid === player.uid) {
        game.players[i].ready = true; //update the ready for the player that sent the ready signal
      }
      if (!game.players[i].ready) {
        shouldStart = false; //if any player is not ready set all ready to false so the all ready message isnt sent to the game room
      }
    }

    console.log(`${player.name} has readied in game ${gameId}.`);

    io.in("/game/" + gameId).emit("ready", game);

    game.started = shouldStart;

    // PLAYING
    if (shouldStart) {
      const game_duration = game.game_duration;
      let start_time = new Date();
      let end_time = new Date(start_time.getTime() + game_duration);

      game.start_time = start_time.toISOString();
      game.end_time = end_time.toISOString();
      game.phase = PHASE.PLAYING;
      let randInt = Math.floor(Math.random() * challenge.length);
      game.image = challenge[randInt].image;
      game.assets = challenge[randInt].assets;
      io.in("/game/" + gameId).emit("start", game);
      io.in("/game/" + gameId + "/spectate").emit("start", game);

      // VOTING
      setTimeout(() => {
        const voting_duration = game.voting_duration;
        start_time = new Date();
        end_time = new Date(start_time.getTime() + voting_duration);
        game.phase = PHASE.VOTING;
        game.start_time = start_time.toISOString();
        game.end_time = end_time.toISOString();

        io.in("/game/" + gameId).emit("game over", game);
        io.in("/game/" + gameId + "/spectate").emit(
          "game over",
          games.get(gameId)
        );

        // FINISHED
        setTimeout(() => {
          game.phase = PHASE.FINISHED;

          io.in("/game/" + gameId).emit("voting over", game);
          io.in("/game/" + gameId + "/spectate").emit("voting over", game);
        }, voting_duration);
      }, game_duration);
    }
  });

  socket.on("vote", (player) => {
    /*
     * {
     *      "gameId": string, // game
     *      "uid": string // vote
     * }
     * */
    const { gameId } = player;
    if (!games.has(gameId))
      return socket.emit("error", {
        error: "The game does not exist!",
      });

    const game = games.get(gameId);
    if (game.phase !== PHASE.VOTING)
      return socket.emit("error", {
        error: "The game is not in the voting phase",
      });

    for (const p of game.players) {
      if (player.uid === p.uid) {
        return ++p.votes;
      }
    }
  });

  socket.on("chat message", (msg) => {
    /* msg_data expected in the form of 
        {
            "gameId": string,
            "name": string,
            "message": string
        }
        */
    console.log(
      `Spectator ${msg.name} said ${msg.message} in game ${msg.gameId}`
    );
    socket.to("/game/" + msg.gameId + "/spectate").emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("A player has disconencted");
  });
});
