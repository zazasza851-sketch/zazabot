import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} from "@whiskeysockets/baileys";

const BOT_NAME = "ZazaStore";
const OWNER = "Zaza";
const PREFIX = ".";

let reconnecting = false;

const MENU = `
╭━━━〔 🤖 ${BOT_NAME} 〕━━━╮
│
│ 👑 OWNER
│ • .owner
│
│ ⚙️ GENERAL
│ • .menu
│ • .ping
│ • .runtime
│
│ 🤖 AI
│ • .openai
│ • .bard
│ • .nexara
│ • .aiimage
│
│ 🎮 GAME
│ • .tictactoe
│ • .tebak
│ • .slot
│
│ 🛠️ TOOLS
│ • .sticker
│ • .toimg
│ • .tts
│ • .shortlink
│
│ 📥 DOWNLOADER
│ • .ytmp3
│ • .ytmp4
│ • .tiktok
│ • .instagram
│
│ 🛒 ZAZASTORE
│ • .produk
│ • .harga
│ • .order
│ • .payment
│
╰━━━━━━━━━━━━━━━━━━━━╯
`;

function getText(message) {
  return (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    ""
  );
}

function getCommand(text) {
  if (!text.startsWith(PREFIX)) return "";
  return text
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();
}

async function startBot() {
  if (reconnecting) return;

  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("./auth");

    const { version } = await fetchLatestBaileysVersion();

    console.log("=================================");
    console.log(`🤖 ${BOT_NAME}`);
    console.log("📡 Starting WhatsApp bot...");
    console.log("📦 Baileys version:", version.join("."));
    console.log("=================================");

    const sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      browser: Browsers.windows("Chrome"),
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    /*
     * =========================
     * PAIRING CODE
     * =========================
     */

    if (!state.creds.registered) {
      const number = process.env.BOT_NUMBER;

      if (!number) {
        console.log("❌ BOT_NUMBER belum diatur di Railway.");
        console.log("Contoh: 6281234567890");
      } else {
        try {
          const cleanNumber = number.replace(/\D/g, "");

          console.log("📱 Meminta pairing code...");
          console.log("📞 Nomor:", cleanNumber);

          const code = await sock.requestPairingCode(
            cleanNumber
          );

          console.log("");
          console.log("╔════════════════════════════╗");
          console.log("║ 🔐 PAIRING CODE ZAZASTORE ║");
          console.log("╠════════════════════════════╣");
          console.log(`║ 👉 ${code}                 ║`);
          console.log("╚════════════════════════════╝");
          console.log("");
          console.log(
            "WhatsApp → Perangkat tertaut → Tautkan perangkat"
          );
          console.log(
            "→ Tautkan dengan nomor telepon"
          );
        } catch (error) {
          console.log(
            "❌ Pairing gagal:",
            error?.message || error
          );
        }
      }
    }

    /*
     * =========================
     * CONNECTION
     * =========================
     */

    sock.ev.on(
      "connection.update",
      ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          reconnecting = false;

          console.log("");
          console.log("╔════════════════════════════╗");
          console.log("║     ✅ ZAZASTORE ONLINE    ║");
          console.log("╚════════════════════════════╝");
          console.log("");
        }

        if (connection === "close") {
          const statusCode =
            lastDisconnect?.error?.output?.statusCode;

          console.log(
            "❌ WhatsApp terputus. Code:",
            statusCode
          );

          if (
            statusCode !== DisconnectReason.loggedOut
          ) {
            console.log("🔄 Menghubungkan kembali...");

            reconnecting = true;

            setTimeout(() => {
              reconnecting = false;
              startBot();
            }, 5000);
          } else {
            console.log(
              "⚠️ Bot logout. Pairing ulang diperlukan."
            );
          }
        }
      }
    );

    /*
     * =========================
     * MESSAGE HANDLER
     * =========================
     */

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {
        try {
          const msg = messages[0];

          if (!msg?.message) return;
          if (msg.key?.fromMe) return;

          const jid = msg.key.remoteJid;
          if (!jid) return;

          const text = getText(msg.message);
          const command = getCommand(text);

          if (!command) return;

          console.log(
            `📩 Command: ${command} | From: ${jid}`
          );

          switch (command) {
            case "menu":
              await sock.sendMessage(jid, {
                text: MENU
              });
              break;

            case "owner":
              await sock.sendMessage(jid, {
                text:
                  "👑 OWNER ZAZASTORE\n\n" +
                  `Nama: ${OWNER}\n` +
                  "Hubungi owner untuk informasi lebih lanjut."
              });
              break;

            case "ping":
              await sock.sendMessage(jid, {
                text: "🏓 Pong!\n\n✅ ZazaStore aktif."
              });
              break;

            case "runtime":
              await sock.sendMessage(jid, {
                text:
                  "⏱️ ZazaStore Runtime\n\n" +
                  "✅ Bot sedang online."
              });
              break;

            case "produk":
              await sock.sendMessage(jid, {
                text:
                  "🛒 PRODUK ZAZASTORE\n\n" +
                  "Silakan hubungi owner untuk daftar produk."
              });
              break;

            case "harga":
              await sock.sendMessage(jid, {
                text:
                  "💰 HARGA ZAZASTORE\n\n" +
                  "Silakan hubungi owner untuk informasi harga."
              });
              break;

            case "order":
              await sock.sendMessage(jid, {
                text:
                  "🛒 ORDER ZAZASTORE\n\n" +
                  "Ketik format order dan kirim ke owner."
              });
              break;

            case "payment":
              await sock.sendMessage(jid, {
                text:
                  "💳 PAYMENT ZAZASTORE\n\n" +
                  "Silakan hubungi owner untuk metode pembayaran."
              });
              break;

            default:
              await sock.sendMessage(jid, {
                text:
                  `❌ Command *${PREFIX}${command}* tidak ditemukan.\n\n` +
                  `Ketik *${PREFIX}menu* untuk melihat menu.`
              });
              break;
          }
        } catch (error) {
          console.log(
            "❌ Message error:",
            error?.message || error
          );
        }
      }
    );

  } catch (error) {
    reconnecting = false;

    console.log(
      "❌ Start bot error:",
      error?.message || error
    );

    setTimeout(() => {
      startBot();
    }, 5000);
  }
}

console.log("🚀 Menjalankan ZazaStore...");
startBot();
