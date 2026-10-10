import "dotenv/config";
import app from "./app";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
