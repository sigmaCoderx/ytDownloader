import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  ytdlpCookies: process.env.YTDLP_COOKIES,
  ytdlpCookiesFromBrowser: process.env.YTDLP_COOKIES_FROM_BROWSER,
};
