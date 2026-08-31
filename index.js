import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";

const BOT_NAME = "ZazaStore";
const AUTH_FOLDER = "./auth";

let reconnecting = false;

async function startBot() {
  if (reconnecting) return;

  try {
    console.log("");
    console.log("================================");
    console.log("🚀 Menjalankan ZazaStore...");
    console.log("================================");

    const { state, saveCreds } =
      await useMultiFileAuthState(AUTH_FOLDER);

    const sock = makeWASocket({
      auth: state,
      browser: Browsers.windows("Chrome"),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    // Simpan session WhatsApp
    sock.ev.on("creds.update", saveCreds);

    // ================================
    // CONNECTION
    // ================================

    sock.ev.on("connection.update", async (update) => {
      const {
        connection,
        lastDisconnect
      } = update;

      if (connection === "connecting") {
        console.log("🔄 Menghubungkan ke WhatsApp...");
      }

      if (connection === "open") {
        console.log("");
        console.log("================================");
        console.log("✅ ZazaStore TERHUBUNG!");
        console.log("================================");
        console.log("");
      }

      if (connection === "close") {
        const statusCode =
          new Boom(lastDisconnect?.error)?.output?.statusCode;

        console.log("");
        console.log("❌ WhatsApp terputus.");
        console.log("📌 Code:", statusCode);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("⚠️ Session logout.");
          console.log("⚠️ Pairing ulang diperlukan.");
          return;
        }

        if (statusCode === DisconnectReason.connectionClosed) {
          console.log("🔄 Mencoba reconnect...");
        }

        if (statusCode === DisconnectReason.connectionLost) {
          console.log("🔄 Koneksi hilang, reconnect...");
        }

        if (statusCode === DisconnectReason.restartRequired) {
          console.log("🔄 WhatsApp meminta restart...");
        }

        reconnecting = true;

        setTimeout(() => {
          reconnecting = false;
          startBot();
        }, 5000);
      }
    });

    // ================================
    // PAIRING CODE
    // ================================

    if (!state.creds.registered) {
      const number = process.env.BOT_NUMBER;

      if (!number) {
        console.log("");
        console.log("❌ BOT_NUMBER BELUM DIATUR!");
        console.log("");
        console.log("Contoh:");
        console.log("BOT_NUMBER=6281234567890");
        console.log("");
        return;
      }

      const cleanNumber = number.replace(/\D/g, "");

      console.log("");
      console.log("📱 Meminta pairing code...");
      console.log("📞 Nomor:", cleanNumber);
      console.log("");

      try {
        const code =
          await sock.requestPairingCode(cleanNumber);

        console.log("");
        console.log("================================");
        console.log("🔐 PAIRING CODE ZAZASTORE");
        console.log("================================");
        console.log("");
        console.log("👉 " + code);
        console.log("");
        console.log("================================");
        console.log("📱 CARA MEMASUKKAN KODE");
        console.log("================================");
        console.log("");
        console.log("WhatsApp");
        console.log("→ Perangkat tertaut");
        console.log("→ Tautkan perangkat");
        console.log("→ Tautkan dengan nomor telepon");
        console.log("→ Masukkan kode di atas");
        console.log("");
        console.log("================================");
        console.log("");
      } catch (error) {
        console.log("");
        console.log("❌ Gagal mendapatkan pairing code");
        console.log("❌", error?.message || error);
        console.log("");
      }
    }

    // ================================
    // PESAN MASUK
    // ================================

    sock.ev.on(
      "messages.upsert",
      async ({ messages, type }) => {
        try {
          if (type !== "notify") return;

          const msg = messages[0];

          if (!msg) return;
          if (!msg.message) return;
          if (msg.key.fromMe) return;

          const jid = msg.key.remoteJid;

          if (!jid) return;

          const message =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            "";

          const text = message.trim();

          console.log(
            "📩 Pesan masuk:",
            text
          );

          // ================================
          // MENU
          // ================================

          if (
            text.toLowerCase() === ".menu" ||
            text.toLowerCase() === "menu"
          ) {
            const menu = `
╭━━━━━━━━━━━━━━━━━━╮
       🛍️ *ZAZASTORE*
╰━━━━━━━━━━━━━━━━━━╯

👋 Halo! Selamat datang di ZazaStore.

📋 *MENU UTAMA*

▸ .menu
▸ .owner
▸ .ping
▸ .info

🛒 *STORE*

▸ .produk
▸ .harga
▸ .order

💬 *BANTUAN*

▸ .help

━━━━━━━━━━━━━━━━━━
🤖 ZazaBot
⚡ Powered by ZazaStore
━━━━━━━━━━━━━━━━━━
`;

            await sock.sendMessage(
              jid,
              { text: menu }
            );

            return;
          }

          // ================================
          // PING
          // ================================

          if (
            text.toLowerCase() === ".ping"
          ) {
            await sock.sendMessage(
              jid,
              {
                text: "🏓 Pong!\n\n✅ ZazaBot aktif."
              }
            );

            return;
          }

          // ================================
          // OWNER
          // ================================

          if (
            text.toLowerCase() === ".owner"
          ) {
            await sock.sendMessage(
              jid,
              {
                text:
                  "👤 *OWNER ZAZASTORE*\n\n" +
                  "Hubungi owner untuk informasi lebih lanjut."
              }
            );

            return;
          }

          // ================================
          // INFO
          // ================================

          if (
            text.toLowerCase() === ".info"
          ) {
            await sock.sendMessage(
              jid,
              {
                text:
                  "🤖 *ZazaBot*\n\n" +
                  "🛍️ ZazaStore\n" +
                  "🟢 Status: Aktif\n" +
                  "⚡ WhatsApp Bot"
              }
            );

            return;
          }

          // ================================
          // PRODUK
          // ================================

          if (
            text.toLowerCase() === ".produk"
          ) {
            await sock.sendMessage(
              jid,
              {
                text:
                  "🛒 *PRODUK ZAZASTORE*\n\n" +
                  "📦 Produk 1\n" +
                  "📦 Produk 2\n" +
                  "📦 Produk 3\n\n" +
                  "Gunakan *.order* untuk melakukan pemesanan."
              }
            );

            return;
          }

          // ================================
          // HARGA
          // ================================

          if (
            text.toLowerCase() === ".harga"
         
