import { AttachmentBuilder, Client } from "discord.js";
import "dotenv/config";
import { execSync } from "child_process";
import { existsSync, writeFileSync, rmSync, readFileSync } from "fs";
import fetch from "node-fetch";
import { parseBuffer } from 'music-metadata';

if (!existsSync("./zxtune123")) {
  console.log("zxtune CLI not found");
  process.exit(1);
}

const client = new Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

client.on("ready", () => {
  console.log("Bot operational and ready to process commands.");
});

client.on("messageCreate", async (message) => {
  if (!message.author.bot) {
    if (message.attachments.size && message.attachments.first()) {
      const attachment = message.attachments.first();
      const extension = attachment.name.split(".").pop();

      if (extension === "pt3") {
        const reply = await message.reply("🤖 Initiating file conversion to MP3 format. Please standby...");

        const pt3FilePath = `./${attachment.name}`;
        const mp3FilePath = `${pt3FilePath}.mp3`;

        try {
          const file = await fetch(attachment.url);
          const buffer = Buffer.from(await file.arrayBuffer());

          writeFileSync(pt3FilePath, buffer);

          execSync(`./zxtune123 --mp3 filename=${mp3FilePath} ${pt3FilePath}`);

          const mp3Buffer = readFileSync(mp3FilePath);

          const metadata = await parseBuffer(mp3Buffer, { mimeType: 'audio/mpeg', size: mp3Buffer.length });
          const artist = metadata.common.artist || 'Unknown Artist';
          const title = metadata.common.title || 'Unknown Title';

          await reply.edit({
            content: `🎶 Your track "${title}" by ${artist} is ready for listening! Enjoy! 🎧🔥`,
            files: [
              new AttachmentBuilder()
                .setName(`${attachment.name}.mp3`)
                .setFile(mp3Buffer),
            ],
          });
        } catch (error) {
          console.error("Error during conversion:", error);
          await reply.edit("🤖 An error occurred during the conversion process. Please try again.");
        } finally {
          if (existsSync(pt3FilePath)) {
            rmSync(pt3FilePath);
          }
          if (existsSync(mp3FilePath)) {
            rmSync(mp3FilePath);
          }
        }
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);
