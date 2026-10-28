function getOrigin() {
  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NODE_ENV === "production") {
    return "https://nocontrolefinanceiro.com.br";
  } else {
    return "http://localhost:3000";
  }
}

const webserver = {
  origin: getOrigin(),
};

export default webserver;
