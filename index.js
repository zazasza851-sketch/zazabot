import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

const BOT_NAME = "ZazaBot";
const OWNER = "Zaza";
const startTime = Date.now();

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("🔄 ZazaBot sedang menghubungkan...");
    }

    if (connection === "open") {
      console.log("✅ ZazaBot ONLINE!");
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;

      if (code !== DisconnectReason.loggedOut) {
        console.log("🔄 Menghubungkan ulang...");
        startBot();
      } else {
        console.log("❌ ZazaBot logout.");
      }
    }
  });

  // Pesan masuk
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();

    // PING
    if (command === ".ping") {
      await sock.sendMessage(jid, {
        text: "🏓 Pong!\n\n🤖 ZazaBot aktif!"
      });
    }

    // OWNER
    else if (command === ".owner") {
      await sock.sendMessage(jid, {
        text:
          "👑 *OWNER ZAZABOT*\n\n" +
          "Nama: " + OWNER + "\n" +
          "Bot: " + BOT_NAME
      });
    }

    // RUNTIME
    else if (command === ".runtime") {
      const seconds =
        Math.floor((Date.now() - startTime) / 1000);

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      await sock.sendMessage(jid, {
        text:
          "⏱️ *RUNTIME ZAZABOT*\n\n" +
          `${hours} jam ${minutes} menit ${secs} detik`
      });
    }

    // MENU
    else if (command === ".menu" || command === ".help") {
      const menu = `
╭━━━〔 🤖 ZAZABOT 〕━━━╮
│
│ 👑 OWNER
│ • .owner
│
│ ⚙️ GENERAL
│ • .ping
│ • .runtime
│ • .menu
│
│ 👥 GROUP
│ • .antilink
│ • .tagall
│ • .hidetag
│ • .kick
│ • .promote
│ • .demote
│ • .linkgc
│
│ 🤖 AI
│ • .ai
│ • .openai
│
│ 🎮 GAME
│ • .math
│ • .truth
│ • .dare
│
│ 🎲 RANDOM
│ • .pantun
│ • .puisi
│ • .quotesanime
│
│ 🔍 SEARCH
│ • .google
│ • .wikipedia
│ • .ytsearch
│
│ 🖼️ STICKER
│ • .sticker
│ • .toimg
│ • .ttp
│
│ 🛠️ TOOLS
│ • .qrcode
│ • .translate
│ • .tts
│
│ 📥 DOWNLOAD
│ • .tiktok
│ • .ytmp3
│ • .ytmp4
│
│ 🏪 ZAZASTORE
│ • WhatsApp Bot
│ • Website
│
╰━━━━━━━━━━━━━━━━━━╯

© 2026 ZazaBot
`;

      await sock.sendMessage(jid, {
        text: menu
      });
    }
  });

  // Pairing Code
  if (!state.creds.registered) {
    const number = process.env.BOT_NUMBER;

    if (number) {
      try {
        const code =
          await sock.requestPairingCode(
            number.replace(/\D/g, "")
          );

        console.log("");
        console.log("================================");
        console.log("📱 PAIRING CODE ZAZABOT");
        console.log("👉 " + code);
        console.log("================================");
        console.log("");
      } catch (error) {
        console.log(
          "❌ Gagal membuat pairing code:",
          error.message
        );
      }
    } else {
      console.log(
        "⚠️ BOT_NUMBER belum diatur."
      );
    }
startBot();
