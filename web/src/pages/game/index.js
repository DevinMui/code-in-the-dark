import { useCallback, useEffect, useState } from "react";
import {
  useHistory,
  useParams,
  useRouteMatch,
  Route,
  Switch,
} from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Waiting from "./waiting";
import Playing from "./playing";
import Voting from "./voting";
import Finished from "./finished";

import socket from "../../lib/socket";

import { useStore, useDispatch } from "react-redux";
import { join } from "../../redux/game";

import Modal from "react-modal";

import PHASE from "./phases";

function Game() {
  const { id } = useParams();
  const history = useHistory();
  const dispatch = useDispatch();
  const store = useStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [name, setName] = useState("");

  const [game, setGame] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(true);

  useEffect(() => {
    switch (game.phase) {
      case PHASE.WAITING:
        document.title = "Coding in the Dark | Waiting...";
        break;
      case PHASE.PLAYING:
        document.title = "Coding in the Dark | Battle!";
        break;
      case PHASE.VOTING:
        document.title = "Coding in the Dark | Vote for your favorite";
        break;
      case PHASE.FINISHED:
        document.title = "Coding in the Dark | Results";
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    // save clear interval
    let timer;

    const createTimer = (game) => {
      // in seconds
      const diff = Math.round((new Date(game.end_time) - new Date()) / 1000);
      console.log("creating timer", diff);
      setTimeLeft(() => diff);
      return setInterval(timerUpdate, 1000);
    };

    const timerUpdate = () => {
      setTimeLeft((t) => (t > 0 ? t - 1 : t));
    };

    const getGame = async () => {
      setRefresh(() => true);
      try {
        const res = await fetch(`/game/${id}`);
        if (res.status >= 400) throw new Error("Something went wrong...");

        const data = await res.json();
        if (!data.success) {
          toast.error("The game does not exist!");
          return history.push("/");
        }

        setGame(() => data);
        setRefresh(() => false);

        socket.on("error", ({ error }) => {
          toast.error(error);
          return history.push("/");
        });

        socket.on("ready", (game) => {
          setGame(() => game);
        });

        socket.on("unready", (game) => {
          setGame(() => game);
        });

        socket.on("join", (game) => {
          setGame(() => game);
          if (game.phase !== PHASE.WAITING && game.phase !== PHASE.FINISHED)
            createTimer(game);
        });

        socket.on("start", (game) => {
          timer = createTimer(game);
          setGame(() => game);
          toast("Starting game");
        });

        socket.on("code update", (game) => {
          setGame(() => game);
        });

        socket.on("game over", (game) => {
          // retrieve new voting times
          clearInterval(timer);
          timer = createTimer(game);

          setGame(() => game);

          toast("The game is over! Voting has started");
        });

        socket.on("voting over", (game) => {
          clearInterval(timer);
          toast("The votes are in!");
          setGame(() => game);
        });

        // toast.success("Spectating game");
      } catch (e) {
        console.error(e);
        setRefresh(false);
        return toast.error("Something went wrong...");
      }
    };

    if (!store.getState().game.name) {
      setModalOpen(true);
    } else {
      joinGame();
    }

    getGame();

    return function cleanup() {
      // clear timer if set
      if (!(game.phase === PHASE.WAITING || game.phase === PHASE.FINISHED))
        clearInterval(timer);
      socket.off("connect");
      socket.off("code");
      socket.off("game over");
      socket.off("voting over");
    };
  }, [history, id]);

  const joinGame = () => {
    const joinee = {
      gameId: id,
      name: store.getState().game.name,
    };
    if (game.started) socket.emit("spectate", joinee);
    socket.emit("join", joinee);
  };

  const onNameSubmit = () => {
    if (!name) return toast.error("Name is empty!");
    dispatch(
      join({
        name,
      })
    );
    joinGame();
    setModalOpen(false);
  };

  const onNameChange = (e) => {
    setName(e.target.value);
  };

  if (refresh)
    return (
      <div className="loader">
        <Loader
          type="TailSpin"
          color="#3b42bf"
          height={100}
          width={100}
          timeout={6000}
        />
      </div>
    );

  const players = game.players;
  const player =
    players.find((p) => p.name === store.getState().game.name) || {};

  return (
    <>
      <DialogModal
        modalOpen={modalOpen}
        name={name}
        onChange={(e) => onNameChange(e)}
        onSubmit={onNameSubmit}
      />
      <div
        className="container"
        style={{
          height: "100%",
        }}
      >
        <div
          className="row"
          style={{
            height: "100%",
          }}
        >
          <div
            className="container"
            style={{
              height: "100%",
            }}
          >
            <Waiting players={players} player={player} game={game} />
            <Playing
              players={players}
              player={player}
              game={game}
              timeLeft={timeLeft}
            />
            <Voting
              players={players}
              player={player}
              game={game}
              timeLeft={timeLeft}
            />
            <Finished players={players} player={player} game={game} />
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

const DialogModal = ({ name, modalOpen, onSubmit, onChange }) => {
  Modal.setAppElement("#root");
  Modal.defaultStyles.overlay.backgroundColor = "rgba(0,0,0,0.5)";
  return (
    <Modal
      isOpen={modalOpen}
      style={{
        content: {
          backgroundColor: "#2d2d2d",
          border: "none",
          top: "50%",
          left: "50%",
          paddingTop: "70px",
          bottom: "10%",
          right: "5%",
          transform: "translate(-50%, -50%)",
        },
      }}
    >
      <div className="container col-6">
        <h2 className="text-center">Join the Room</h2>
        <input
          placeholder="Name"
          className="splash-input form-control"
          type="text"
          value={name}
          onChange={(e) => onChange(e)}
          required
        />
        <button className="splash-input form-control btn" onClick={onSubmit}>
          Spectate
        </button>
      </div>
    </Modal>
  );
};

export default Game;
