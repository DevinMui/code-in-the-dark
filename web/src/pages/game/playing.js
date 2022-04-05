import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { useState } from "react";
import socket from "../../lib/socket";
import PHASE from "./phases";

const Playing = ({ player, players, game, timeLeft }) => {
  const [opponentIndex, setOpponentIndex] = useState(0);
  const [code, setCode] = useState(player.code);

  const s = timeLeft % 60;
  const m = Math.floor(timeLeft / 60);
  let t = m + ":";
  if (s === 0) t += "00";
  else if (s < 10) t += "0" + s;
  else t += s;

  if (game.phase !== PHASE.PLAYING) return <></>;

  const onChange = (value) => {
    setCode(value);
    socket.emit("code update", {
      ...player,
      code: value,
    });
  };

  const onLeft = () => {
    setOpponentIndex((index) => index - 1);
  };

  const onRight = () => {
    setOpponentIndex((index) => index + 1);
  };

  const censored = players[opponentIndex].code
    .toLowerCase()
    .replace(/[^\n ]/g, "x");

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

      <div className="row">
        <div className="col-6">
          <CodeMirror
            value={code}
            minHeight="200px"
            maxHeight="600px"
            extensions={[html()]}
            onChange={onChange}
            theme="dark"
          />
        </div>

        <div className="col-6">
          <CodeMirror
            id="opponent-code"
            editable={false}
            value={censored}
            minHeight="200px"
            maxHeight="600px"
            extensions={[html()]}
            theme="dark"
          />
          <button
            className="btn"
            onClick={onLeft}
            disabled={opponentIndex === 0}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span>
            {opponentIndex + 1} / {players.length}
          </span>
          <button
            className="btn"
            onClick={onRight}
            disabled={opponentIndex === players.length - 1}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default Playing;
