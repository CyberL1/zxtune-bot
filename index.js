import { AttachmentBuilder, Client } from "discord.js";
import "dotenv/config";
import { execSync } from "child_process";
import { createReadStream, rmSync, writeFileSync } from "fs";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

client.on("ready", () => {
  console.log("Bot ready");
});

client.on("messageCreate", async (message) => {
  if (!message.author.bot) {
    if (message.attachments.size && message.attachments.first()) {
      const attachment = message.attachments.first();
      const extension = attachment.name.split(".").pop();

      if (extension === "pt3") {
        const reply = await message.reply("Converting to wav");

        // Convert to .wav
        const file = await fetch(attachment.url);
        writeFileSync(attachment.name, Buffer.from(await file.arrayBuffer()));

        execSync(
          `./zxtune123 --wav filename=${attachment.name}.wav ${attachment.name}`,
        );

        const wavFile = createReadStream(`./${attachment.name}.wav`);

        reply.edit({
          content: "done",
          files: [
            new AttachmentBuilder()
              .setName(`${attachment.name}.wav`)
              .setFile(wavFile),
          ],
        });

        // Cleanup
        rmSync(attachment.name);
        // rmSync(`${attachment.name}.wav`);
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);
