const { Command } = require('discord.js-commando-plus');

class CommandRankChannel extends Command {
    constructor(client) {
        super(client, {
            name: 'rank-channel',
            group: 'overwatch',
            module: 'overwatch',
            memberName: 'rank-channel',
            guildOnly: true,
            userPermissions: ['MANAGE_CHANNELS'],

            args: [
                {
                    key: 'channel',
                    type: 'channel',
                    default: '',
                    validate: (val, msg) => val === '' || val === 'none' || client.registry.types.get('channel').validate(val, msg),
                    parse: (val, msg) => val === 'none' ? 'none' : client.registry.types.get('channel').parse(val, msg)
                }
            ]
        });
    }

    async run(msg, args) {
        let { channel } = args;

        if (!channel) {
            // Just output the current configured channel
            channel = await msg.guild.settings.get('rank-poster-channel');
            if (!channel) {
                return msg.reply(this.localization.tl('output.no-channel', msg.guild, { args, cmd: this }));
            }
            channel = this.client.resolver.resolveChannel(channel);
            return msg.reply(this.localization.tl('output.channel', msg.guild, { args, channel, cmd: this }));
        }

        if (channel === 'none') {
            await msg.guild.settings.set('rank-poster-channel', null);
            const worker = this.client.registry.workers.get('rank-poster');
            if (worker) {
                await worker.setEnabledIn(msg.guild, false);
            }
            return msg.reply(this.localization.tl('output.disabled', msg.guild, { args, cmd: this }));
        }

        if (!channel.permissionsFor(this.client.user).has('SEND_MESSAGES')) {
            return msg.reply(this.localization.tl('output.no-permissions', msg.guild, { args, cmd: this }));
        }

        await msg.guild.settings.set('rank-poster-channel', channel.id);
        return msg.reply(this.localization.tl('output.set-channel', msg.guild, { args, channel, cmd: this }));
    }
}

module.exports = CommandRankChannel;
