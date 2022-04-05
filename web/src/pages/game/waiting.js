import socket from "../../lib/socket";
import PHASE from "./phases";

const Waiting = ({ player, players, game }) => {
  if (game.phase !== PHASE.WAITING) return <></>;

  const onReady = () => {
    socket.emit("ready", player);
  };
  const onUnready = () => {
    socket.emit("unready", player);
  };

  return (
    <>
      <div className="row">
        {players.map((p) => {
          return <PlayerCard player={p} />;
        })}
      </div>
      <div className="ready-up">
        {player.ready ? (
          <button className="btn btn-green" onClick={onUnready}>
            Unready
          </button>
        ) : (
          <button className="btn btn-green-unfilled" onClick={onReady}>
            Ready Up
          </button>
        )}
      </div>
    </>
  );
};

const PlayerCard = ({ player }) => {
  const cardStyle = player.ready
    ? {
        backgroundColor: player.color,
      }
    : { border: `3px solid ${player.color}` };
  return (
    <div className="col-4">
      <div className="waiting-player-card" style={cardStyle}>
        <h4>{player.name}</h4>
        <div className="ready">
          {player.ready ? (
            <>
              Ready <i className="bi bi-check-circle-fill"></i>
            </>
          ) : (
            <>
              Not Ready <i className="bi bi-check-circle"></i>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Waiting;
