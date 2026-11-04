
require("dotenv").config();

function need(k) {
  const v = process.env[k];
  if (!v) throw Error(`Missing ${k}`);
  return v;
}

const prod = process.env.NODE_ENV === "production";

const r2Keys = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

const r2Configured = r2Keys.every(
  (key) => Boolean(process.env[key])
);

if (prod && !r2Configured) {
  throw new Error("Cloudflare R2 configuration required in production");
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  db: need("MONGODB_URI"),
  secret: need("SESSION_SECRET"),
  origin: need("CLIENT_ORIGIN"),
  prod,

  r2: {
    account: process.env.R2_ACCOUNT_ID || "",
    key: process.env.R2_ACCESS_KEY_ID || "",
    secret: process.env.R2_SECRET_ACCESS_KEY || "",
    bucket: process.env.R2_BUCKET_NAME || "",
    configured: r2Configured,
  },
};
