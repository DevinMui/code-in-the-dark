import "./App.css";
import { BrowserRouter as Router, Switch, Link, Route } from "react-router-dom";

import { Provider } from "react-redux";
import store from "./redux";

import Game from "./pages/game";
import Splash from "./pages/splash/splash";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-transparent">
      <Link to="/" className="navbar-brand">
        <img
          src="/logo.png"
          width="30"
          height="30"
          alt="Logo"
          style={{ marginRight: "15px" }}
        />
        Punchcode
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        dataToggle="collapse"
        dataTarget="#navbarSupportedContent"
        ariaControls="navbarSupportedContent"
        ariaExpanded="false"
        ariaLabel="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
    </nav>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Navbar />
        <Switch>
          <Route path="/game/:id">
            <Game />
          </Route>
          <Route exact path="/">
            <Splash />
          </Route>
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
