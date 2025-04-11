import { app } from "./app.js";
import dotenv from 'dotenv';
import connectDB from "./db/index.js";

dotenv.config({
    path: "./src/.env",
    credentials: true
});
const PORT = process.env.PORT || 8000
connectDB()
    .then(
        () => {
            app.listen(PORT, () => {
                console.log(`App is listening on PORT ${PORT} `)
            })
        }
    )
    .catch(
        (err) => {
            console.log(`Mongodb connection error ${err}`)
        }
    )
