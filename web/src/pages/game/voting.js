import { useEffect, useState } from "react";
import { useHistory, useParams, useRouteMatch } from "react-router-dom";
import Frame, { FullFrame } from "./frame";
import socket from "../../lib/socket";
import PHASE from "./phases";

const Voting = ({ players, game, timeLeft }) => {
  const [voted, setVoted] = useState(false);
  const s = timeLeft % 60;
  const m = Math.floor(timeLeft / 60);
  let t = m + ":";
  if (s === 0) t += "00";
  else if (s < 10) t += "0" + s;
  else t += s;

  if (game.phase !== PHASE.VOTING) return <></>;

  return (
    <>
      <p>Time Left: {t}</p>
      <a href={`${game.image}`} target="_blank" rel="noreferrer">
        <img
          alt="Website Screenshot"
          src={game.image}
          className="img-fluid"
          style={{
            width: "50%",
            display: "block",
            margin: "0 auto",
          }}
        />
      </a>

      <p>Vote for your favorite design!</p>
      <Gallery
        players={players}
        voted={voted}
        onVote={(p) => {
          setVoted(true);
          socket.emit("vote", p);
        }}
      />
    </>
  );
};

function Gallery({ players, phase, voted, onVote }) {
  const match = useRouteMatch();

  return (
    <>
      <div className="row">
        {players.map((player) => (
          <Frame
            player={player}
            phase={phase}
            to={`${match.url}/screen/${player.name}`}
            voted={voted}
            onVote={(p) => {
              onVote(p);
            }}
          />
        ))}
      </div>
    </>
  );
}

function Focus({ path, players, phase }) {
  const history = useHistory();
  const { player_id } = useParams();
  const [player, setPlayer] = useState({});

  useEffect(() => {
    for (const p of players) {
      if (p.uid === player_id) return setPlayer(p);
    }
    history.push(path);
  }, [player, history, path, player_id, players]);

  return (
    <>
      <FullFrame player={player} phase={phase} path={path} />
    </>
  );
}

export default Voting;
