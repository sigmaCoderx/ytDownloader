import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
<<<<<<< HEAD
  console.log(`ytDl server running at http://localhost:${env.port}`);
=======
  console.log(`ytDownloader server running at http://localhost:${env.port}`);
>>>>>>> 4cfecaf (fixed the broken code)
});
