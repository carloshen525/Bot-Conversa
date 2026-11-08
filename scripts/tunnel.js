const localtunnel = require("localtunnel");

let currentTunnel = null;
let isReconnecting = false;

async function startTunnel() {
  if (isReconnecting) return;
  isReconnecting = true;

  try {
    if (currentTunnel) {
      try {
        currentTunnel.close();
      } catch (_) {}
    }

    console.log("[Tunnel] Conectando ao localtunnel...");
    const tunnel = await localtunnel({
      port: 3000,
      subdomain: "botconversa-flow",
    });

    currentTunnel = tunnel;
    isReconnecting = false;
    console.log(`[Tunnel] Aberto com sucesso em: ${tunnel.url}`);

    tunnel.on("close", () => {
      console.log("[Tunnel] Conexão encerrada pelo servidor. Reconectando em 3s...");
      setTimeout(startTunnel, 3000);
    });

    tunnel.on("error", (err) => {
      console.error("[Tunnel] Erro:", err.message);
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.error("[Tunnel] Falha ao iniciar túnel:", err.message);
    isReconnecting = false;
    setTimeout(startTunnel, 4000);
  }
}

// Keep node event loop alive indefinitely
setInterval(() => {}, 1000 * 60 * 60);

startTunnel();
