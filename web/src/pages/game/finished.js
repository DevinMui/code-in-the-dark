import { useRouteMatch } from "react-router-dom";
import { ResultFrame } from "./frame";
import PHASE from "./phases";

const Finished = ({ players, game }) => {
  if (game.phase !== PHASE.FINISHED) return <></>;

  const highestVotes = Math.max.apply(
    Math,
    players.map((p) => p.votes)
  );
  const winners = players.filter((p) => p.votes === highestVotes);
  const isTie = winners.length > 1;

  const resultsText = isTie
    ? `The results are in and it's a tie!`
    : `The results are in and we have a winner!`;

  return (
    <>
      <p>{resultsText}</p>

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

      <Gallery players={players} />
    </>
  );
};

function Gallery({ players }) {
  const match = useRouteMatch();

  return (
    <>
      <div className="row">
        {players.map((player) => (
          <ResultFrame
            player={player}
            to={`${match.url}/screen/${player.name}`}
          />
        ))}
      </div>
    </>
  );
}

export default Finished;
