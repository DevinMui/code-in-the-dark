const PLAYERS = [
  {
    name: "Devin",
    uid: 0,
    code: `
    <!doctype html>
    <html>
    <head>
    </head>
    <body>
    <h1>this is not a test</h1>
    <h2>not really but</h2>
    <p>sometimes i am</p>
    </body>
    </html>
    `,
    ready: true,
    votes: 3,
    color: "#6E33E9",
  },
  {
    name: "Aaron",
    uid: 1,
    code: `
    <!doctype html>
    <html>
    <head>
    </head>
    <body>
    <h1>this is a test</h1>
    <h2>not really but</h2>
    <p>sometimes i am</p>
    </body>
    </html>
    `,
    ready: false,
    votes: 2,
    color: "#C931FF",
  },
];
export default PLAYERS;
