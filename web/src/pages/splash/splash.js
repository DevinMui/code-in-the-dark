import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import socket from "../../lib/socket";

import { useDispatch } from "react-redux";
import { join } from "../../redux/game";

function Splash() {
  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [participantType, setParticipantType] = useState("join"); // join, create, spectate

  const dispatch = useDispatch();

  const history = useHistory();

  useEffect(() => {
    document.title = "Coding in the Dark | Test your CSS skills";
    socket.on("error", (error) => {
      toast.error(error.error);
    });

    return function cleanup() {
      socket.off("error");
    };
  }, []);

  const onSubmit = async () => {
    if (!name) return toast.error("Name is empty!");
    if (participantType !== "create" && !game)
      return toast.error("Game code is empty!");
    try {
      const res =
        participantType === "create"
          ? await fetch("/game", { method: "POST" })
          : await fetch(`/game/${game}`);
      if (res.status >= 400) throw new Error("Something went wrong...");

      const data = await res.json();
      if (!data.success) return toast.error("Game does not exist!");

      const { id } = data;

      dispatch(
        join({
          name,
        })
      );
      history.push(`/game/${id}`);
    } catch (e) {
      console.error(e);
      return toast.error("Something went wrong...");
    }
  };

  return (
    <div
      className="container"
      style={{
        height: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          className="text-center"
          style={{
            marginBottom: "40px",
          }}
        >
          Coding in the Dark
        </h1>

        <p style={{ textAlign: "center" }} id="splash-participant-selection">
          <span
            className={participantType === "join" && "active"}
            onClick={() => setParticipantType("join")}
          >
            Join
          </span>{" "}
          |{" "}
          <span
            className={participantType === "create" && "active"}
            onClick={() => setParticipantType("create")}
          >
            Create
          </span>{" "}
          |{" "}
          <span
            className={participantType === "spectate" && "active"}
            onClick={() => setParticipantType("spectate")}
          >
            Spectate
          </span>{" "}
          a game
        </p>
        <div className="offset-3 col-6">
          <input
            placeholder="Name"
            className="splash-input form-control"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {participantType !== "create" && (
            <input
              placeholder="Game Code"
              className="splash-input form-control"
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              required
            />
          )}
          <button className="splash-input form-control btn" onClick={onSubmit}>
            {participantType}
          </button>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default Splash;
