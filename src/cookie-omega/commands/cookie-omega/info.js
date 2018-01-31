const { RichEmbed } = require('discord.js');
const { Command } = require('discord.js-commando-plus');

class CommandInfo extends Command {
    constructor(client) {
        super(client, {
            name: 'info',
            group: 'cookie-omega',
            module: 'cookie-omega',
            memberName: 'info'
        });
    }

    async run(msg) {
        const embed = new RichEmbed()
            .setTitle(this.localization.tl('embed.title', msg.guild, { name: this.client.user.username }))
            .setDescription(this.localization.tl('embed.description', msg.guild))
            .setThumbnail(this.client.user.avatarURL)
            .addField(
                this.localization.tl('embed.memory-usage', msg.guild),
                this.localization.tl('embed.memory-usage-value', msg.guild, { memory: process.memoryUsage().rss }),
                true
            ).addField(
                this.localization.tl('embed.version', msg.guild),
                this.localization.tl('embed.version-value', msg.guild, { version: process.version }),
                true
            ).addField(
                this.localization.tl('embed.uptime', msg.guild),
                this.localization.tl('embed.uptime-value', msg.guild, { uptime: process.uptime() * 1000 }),
                true
            ).addField(
                this.localization.tl('embed.source-code', msg.guild),
                this.localization.tl('embed.source-code-value', msg.guild, { source: 'https://github.com/Archomeda/cookie-omega-discord-bot' }),
                true
            );
        return msg.reply('', { embed });
    }
}

module.exports = CommandInfo;
