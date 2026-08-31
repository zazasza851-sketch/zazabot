import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    fetchLatestWaWebVersion
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";

const BOT_NAME = "ZazaStore";
const OWNER = "Zaza";
const PREFIX = ".";

let reconnecting = false;

const MENU = `
╭━━━〔 🤖 ZAZASTORE 〕━━━╮
┃
┃ 👤 OWNER
┃ • .owner
┃
┃ ⚙️ GENERAL
┃ • .menu
┃ • .ping
┃ • .runtime
┃
┃ 🤖 AI
┃ • .openai
┃ • .bard
┃ • .nexara
┃ • .aiimage
┃
┃ 🎮 GAME
┃ • .akinator
┃ • .asahotak
┃ • .caklontong
┃ • .family100
┃ • .math
┃ • .truth
┃ • .dare
┃
┃ 🎨 STICKER
┃ • .sticker
┃ • .attp
┃ • .ttp
┃ • .toimg
┃
┃ 🔎 SEARCH
┃ • .google
┃ • .googleimage
┃ • .wikipedia
┃ • .ytsearch
┃ • .lirik
┃
┃ 📥 DOWNLOAD
┃ • .tiktoknowm
┃ • .tiktokwm
┃ • .igdl
┃ • .igreel
┃ • .facebook
┃ • .ytmp3
┃ • .ytmp4
┃
┃ 🛠️ TOOLS
┃ • .qrcode
┃ • .translate
┃ • .tts
┃ • .ocr
┃ • .shortlink
┃
┃ 👥 GROUP
┃ • .tagall
┃ • .hidetag
┃ • .kick
┃ • .promote
┃ • .demote
┃ • .groupinfo
┃ • .linkgc
┃ • .antilink
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

Ketik *.menu* untuk melihat menu.
`;

async function startBot() {
  if (reconnecting) return;

  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("./auth");

const { version } = await fetchLatestWaWebVersion();

const sock = makeWASocket({
    auth: state,
    version,
   printQRInTerminal: false,
    browser: Browsers.windows("Chrome"),
    markOnlineOnConnect: false,
    syncFullHistory: false
});
    

    sock.ev.on("connection.update", ({ qr }) => {
  if (qr) {
    console.log("📱 QR CODE:");
    qrcode.generate(qr, { small: true });
  }
});;

    /*
     * =========================
     * PAIRING CODE
     * =========================
     */

    if (!state.creds.registered) {
    const number = process.env.BOT_NUMBER;
      if (!number) {
        console.log(
          "❌ BOT_NUMBER belum diatur di Railway."
        );
      } else {
        setTimeout(async () => {
          try {
            const cleanNumber =
              number.replace(/\D/g, "");

            console.log(
              "📱 Meminta pairing code..."
            );

            const code =
              await sock.requestPairingCode(
                cleanNumber
              );

            console.log("");
            console.log(
              "================================"
            );
            console.log(
              "🔐 PAIRING CODE ZAZASTORE"
            );
            console.log(
              "👉 " + code
            );
            console.log(
              "================================"
            );
            console.log("");
          } catch (error) {
            console.log(
              "❌ Pairing gagal:",
              error.message
            );
          }
        }, 5000);
      }
    }

    /*
     * =========================
     * CONNECTION
     * =========================
     */

    sock.ev.on(
      "connection.update",
      async (update) => {
        const {
          connection,
          lastDisconnect
        } = update;

        if (connection === "connecting") {
          console.log(
            "🔄 ZazaStore sedang menghubungkan..."
          );
        }

        if (connection === "open") {
          reconnecting = false;

          console.log("");
          console.log(
            "╔══════════════════════╗"
          );
          console.log(
            "║   🤖 ZAZASTORE       ║"
          );
          console.log(
            "║   ✅ BOT ONLINE      ║"
          );
          console.log(
            "╚══════════════════════╝"
          );
          console.log("");
        }

        if (connection === "close") {
          const statusCode =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          console.log(
            "❌ Koneksi terputus:",
            statusCode
          );

          if (
            statusCode !==
            DisconnectReason.loggedOut
          ) {
            if (!reconnecting) {
              reconnecting = true;

              console.log(
                "🔄 Reconnect 5 detik..."
              );

              setTimeout(() => {
                reconnecting = false;
                startBot();
              }, 5000);
            }
          } else {
            console.log(
              "❌ WhatsApp logout."
            );
            console.log(
              "⚠️ Hapus session auth lalu pairing ulang."
            );
          }
        }
      }
    );

    /*
     * =========================
     * PESAN MASUK
     * =========================
     */

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {
        try {
          const msg = messages[0];

          if (!msg) return;
          if (!msg.message) return;
          if (msg.key.fromMe) return;

          const jid =
            msg.key.remoteJid;

          if (!jid) return;

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage
              ?.text ||
            msg.message.imageMessage
              ?.caption ||
            msg.message.videoMessage
              ?.caption ||
            "";

          if (!text) return;

          const body =
            text.trim();

          if (!body.startsWith(PREFIX)) {
            return;
          }

          const args =
            body
              .slice(PREFIX.length)
              .trim()
              .split(/\s+/);

          const command =
            args
              .shift()
              ?.toLowerCase();

          /*
           * =========================
           * MENU
           * =========================
           */

          if (command === "menu") {
            await sock.sendMessage(
              jid,
              {
                text: MENU
              }
            );
            return;
          }

          /*
           * =========================
           * PING
           * =========================
           */

          if (command === "ping") {
            const start =
              Date.now();

            await sock.sendMessage(
              jid,
              {
                text:
                  "🏓 *PONG!*\n\n" +
                  "🤖 Bot: ZazaStore\n" +
                  "⚡ Status: Online\n" +
                  "📡 Speed: " +
                  (Date.now() - start) +
                  " ms"
              }
            );
            return;
          }

          /*
           * =========================
           * OWNER
           * =========================
           */

          if (command === "owner") {
            await sock.sendMessage(
              jid,
              {
                text:
                  "👑 *OWNER ZAZASTORE*\n\n" +
                  "Nama: " + OWNER +
                  "\nBot: " + BOT_NAME
              }
            );
            return;
          }

          /*
           * =========================
           * RUNTIME
           * =========================
           */

          if (command === "runtime") {
            const total =
              Math.floor(
                process.uptime()
              );

            const hours =
              Math.floor(
                total / 3600
              );

            const minutes =
              Math.floor(
                (total % 3600) / 60
              );

            const seconds =
              total % 60;

            await sock.sendMessage(
              jid,
              {
                text:
                  "⏱️ *ZAZASTORE RUNTIME*\n\n" +
                  hours +
                  " jam " +
                  minutes +
                  " menit " +
                  seconds +
                  " detik"
              }
            );

            return;
          }

          /*
           * =========================
           * STATUS
           * =========================
           */

          if (command === "status") {
            await sock.sendMessage(
              jid,
              {
                text:
                  "🤖 *ZazaStore Status*\n\n" +
                  "✅ Bot aktif\n" +
                  "✅ WhatsApp terhubung\n" +
                  "✅ Server berjalan"
              }
            );

            return;
          }
  // =========================
  // GAME
  // =========================

  if (command === "dare") {
    const dare = [
      "Kirim foto paling kocak di galeri kamu 😂",
      "Sebutkan 3 hal yang kamu sukai.",
      "Chat temanmu: Aku punya rahasia 🤫",
      "Buat status WhatsApp yang lucu.",
      "Nyanyikan lagu favoritmu selama 10 detik 🎤"
    ];

    const random = dare[Math.floor(Math.random() * dare.length)];

    await sock.sendMessage(jid, {
      text: "🎯 *DARE ZAZASTORE*\n\n" + random
    });

    return;
  }

  if (command === "truth") {
    const truth = [
      "Siapa orang terakhir yang kamu chat?",
      "Apa kebiasaan burukmu?",
      "Pernah bohong kepada teman?",
      "Siapa orang yang paling sering kamu pikirkan?",
      "Apa hal paling memalukan yang pernah kamu lakukan?"
    ];

    const random = truth[Math.floor(Math.random() * truth.length)];

    await sock.sendMessage(jid, {
      text: "💭 *TRUTH ZAZASTORE*\n\n" + random
    });

    return;
  }

  if (command === "botinfo") {
    await sock.sendMessage(jid, {
      text:
        "🤖 *ZazaStore Bot Info*\n\n" +
        "👑 Owner: " + OWNER + "\n" +
        "🤖 Bot: " + BOT_NAME + "\n" +
        "⚡ Status: Online\n" +
        "🟢 WhatsApp: Terhubung"
    });

    return;
  }

  if (command === "produk") {
    await sock.sendMessage(jid, {
      text:
        "🛍️ *ZAZASTORE*\n\n" +
        "📦 Produk tersedia\n" +
        "💰 Harga: Hubungi owner\n" +
        "📲 Order: .order\n\n" +
        "Ketik *.order* untuk melakukan pemesanan."
    });

    return;
  }

  if (command === "order") {
    await sock.sendMessage(jid, {
      text:
        "🛒 *ORDER ZAZASTORE*\n\n" +
        "Silakan kirim:\n" +
        "1. Nama produk\n" +
        "2. Jumlah\n" +
        "3. Nama pembeli\n\n" +
        "Pesanan akan diproses oleh owner."
    });

    return;
  }
          /*
           * =========================
           * UNKNOWN COMMAND
           * =========================
           */

          await sock.sendMessage(
            jid,
            {
              text:
                "❌ Command tidak ditemukan.\n\n" +
                "Ketik *.menu* untuk melihat daftar command."
            }
          );

        } catch (error) {
          console.log(
            "❌ Error message:",
            error.message
          );
        }
      }
    );

  } catch (error) {
    console.log(
      "❌ Error startBot:",
      error.message
    );

    setTimeout(
      startBot,
      5000
    );
  }
}

/*
 * =========================
 * START ZAZASTORE
 * =========================
 */

console.log("");
console.log(
  "🤖 ZazaStore sedang dijalankan..."
);
console.log("");

startBot();
