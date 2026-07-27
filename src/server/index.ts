
// import app from "./app.js";
// import { env } from "./config/env.js";

// app.listen(env.port, () => {
//   console.log(`ytDownloader server running at http://localhost:${env.port}`);
// });

import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, "0.0.0.0", () => {
  console.log(`ytDownloader server running on port ${env.port}`);
});

