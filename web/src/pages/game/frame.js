import { Link } from "react-router-dom";

const PHASE = {
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  VOTING: "VOTING",
  FINISHED: "FINISHED",
};

function Badge({ phase, player, fullFrame, voted, onVote }) {
  switch (phase) {
    case PHASE.WAITING:
      if (fullFrame) return <></>;
      return (
        <div
          className={`badge-button ${
            fullFrame === true ? "badge-full-frame" : "badge-small-frame"
          } ${player.ready === true ? "badge-ready" : "badge-unready"}`}
        />
      );
    case PHASE.PLAYING:
      return <></>;
    case PHASE.VOTING:
      if (voted) return <></>;
      return (
        <div
          className={`badge-button badge-voting ${
            fullFrame === true ? "badge-full-frame" : "badge-small-frame"
          }`}
          onClick={() => {
            onVote(player);
          }}
        >
          Vote!
        </div>
      );
    case PHASE.FINISHED:
      return (
        <div
          className={`badge-button badge-placement ${
            fullFrame === true ? "badge-full-frame" : "badge-small-frame"
          }`}
        >
          {player.votes}
        </div>
      );
    default:
      return <></>;
  }
}

function ResultFrame({ player, to }) {
  return (
    <div className="col-4">
      <div className="small-frame-container">
        <p className="frame-name" style={{ marginTop: "10px" }}>
          <span>
            <Link to={to}>{player.name}</Link>
          </span>
        </p>
        <div className="embed-responsive embed-responsive-16by9">
          <iframe
            srcDoc={player.code.replace(
              /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
              ""
            )}
            title={player.name}
            className="iframe small-frame embed-responsive-item"
          />
        </div>
      </div>
      <button
        className={`btn disabled btn-block`}
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      >
        Votes: {player.votes}
      </button>
    </div>
  );
}

function Frame({ player = {}, to, voted, onVote }) {
  return (
    <div className="col-4">
      <div className="small-frame-container">
        <p className="frame-name" style={{ marginTop: "10px" }}>
          <span>
            <Link to={to}>?</Link>
          </span>
        </p>
        <div className="embed-responsive embed-responsive-16by9">
          <iframe
            srcDoc={player.code.replace(
              /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
              ""
            )}
            title={player.name}
            className="iframe small-frame embed-responsive-item"
          />
        </div>
      </div>
      <button
        className={`btn ${voted ? "disabled" : "btn-primary"} btn-block`}
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        onClick={() => onVote(player)}
      >
        Vote
      </button>
    </div>
  );
}

function FullFrame({ player = {}, phase, path }) {
  return (
    <>
      <h5 className="frame-name">
        Viewing {player.name} | <Link to={path}>Back</Link>
      </h5>
      <div
        style={{
          height: "100%",
        }}
      >
        <div style={{ height: "100%" }}>
          <iframe
            srcDoc={
              player.code
                ? player.code.replace(
                    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                    ""
                  )
                : ""
            }
            title={player.name}
            className="iframe full-frame"
          />
          <Badge phase={phase} player={player} fullFrame={true} />
        </div>
      </div>
    </>
  );
}

export default Frame;
export { FullFrame, ResultFrame };
