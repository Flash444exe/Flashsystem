  const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, mute } = require('./config.json');
const token = process.env.token;
const moment = require('moment')
const { MessageEmbed, Client, Intents, Permissions, Message  } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_PRESENCES] });
const wait = require('util').promisify(setTimeout);
const ms = require('ms')
const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
	new SlashCommandBuilder().setName('user').setDescription('Replies with user info!').addUserOption(op => op.setName('user').setDescription('the user to get his info.')),
    new SlashCommandBuilder().setName('ban').setDescription('ban someone').addUserOption(option =>option.setName('member').setDescription('the user to ban.').setRequired(true)).addStringOption(op => op.setName('reason').setDescription('the banning reason.').setRequired(false)),
   new SlashCommandBuilder().setName('kick').setDescription('kick someone').addUserOption(option =>option.setName('member').setDescription('the user to kick.').setRequired(true)),
   new SlashCommandBuilder().setName('mute').setDescription('mute someone').addUserOption(option =>option.setName('target').setDescription('the user to mute.').setRequired(true)).addStringOption(option =>option.setName('time').setDescription('mute time.').setRequired(false)).addStringOption(option =>option.setName('reason').setDescription('the reason of mute.').setRequired(false)),
   new SlashCommandBuilder().setName('unban').setDescription('unban someone').addStringOption(option =>option.setName('id').setDescription('the user id.').setRequired(true)),
   new SlashCommandBuilder().setName('unmute').setDescription('unmute someone').addUserOption(option =>option.setName('target').setDescription('the muted member.').setRequired(true)),

   new SlashCommandBuilder().setName('help').setDescription('display help menu.'),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();
client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;
    if(commandName === "help") {
        interaction.reply({embeds: [new MessageEmbed().setTitle('my commands:').setDescription(`/ban: to ban someone.\nunban: to unban a member.\n /mute : to mute a member.\n unmute: to unmute a member. \n /kick: to kick a member.`)]})
    }
    else if(commandName === 'ban') {
        if(!interaction.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) return;
        let someone = interaction.options.getUser('member')
        let user = interaction.guild.members.cache.get(someone.id)
        if(!user) return interaction.reply('member not found in the server.')

        let reason = interaction.options.getString('reason') || "No Reason provided."

            if(user.roles.highest.position > interaction.guild.members.resolve(client.user).roles.highest.position)
            return interaction.reply("i cant kick someone with higher roles than me.")
            if(user.roles.highest.position > interaction.guild.members.resolve(interaction.member).roles.highest.position)
            return interaction.reply("you can't kick someone with roles higher than you.")
            if(interaction.member.user.id === user.id) return interaction.reply('you cant kick yourself xd!')
                if(user.id === client.user.id) return interaction.reply('i cant kick my self lol!')
        
        interaction.reply(`🛫**| ${user.tag} got banned from the server.**`)
        interaction.guild.members.ban(user.id,{reason: `ban command by : ${interaction.member.user.tag} with reason: ${reason}`})
    }else if (commandName === 'mute') {
        if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) return;
        let user = interaction.options.getUser('target')
        let member = interaction.guild.members.cache.get(user.id)
        if(!member) return interaction.reply('member not found in the server.')
        let muted = interaction.guild.roles.cache.find(r => r.name === mute)
        if(!muted) return interaction.reply(`**\`Mute\` role not found.**`)
        if(member.roles.highest.position > interaction.guild.members.resolve(client.user).roles.highest.position)
        return interaction.reply("i cant mute someone with higher roles than me.")
        if(member.roles.highest.position > interaction.guild.members.resolve(interaction.member).roles.highest.position)
        return interaction.reply("you can't mute someone with roles higher than you.")
        if(interaction.member.user.id === member.id) return interaction.reply('you cant mute yourself xd!')
            if(member.id === client.user.id) return interaction.reply('i cant mute my self lol!')
        if(member.roles.cache.has(muted.id)) return interaction.reply('this member already muted.')
        let time = interaction.options.getString('time') || "1h"
        interaction.reply(`✅**| ${user.tag} got has been muted.**`)
       
        member.roles.add(muted.id)
        setTimeout(() => {
            member.roles.remove(muted.id).catch(err => {})
        }, ms(time))
    }
    else if (commandName === 'unmute') {
        if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) return;
        let user = interaction.options.getUser('target')
        let member = interaction.guild.members.cache.get(user.id)
        if(!member) return interaction.reply('member not found in the server.')
        let muted = interaction.guild.roles.cache.find(r => r.name === mute)
        if(!muted) return interaction.reply(`**\`Mute\` role not found.**`)
        if(member.roles.highest.position > interaction.guild.members.resolve(client.user).roles.highest.position)
        return interaction.reply("i cant unmute someone with higher roles than me.")
        if(member.roles.highest.position > interaction.guild.members.resolve(interaction.member).roles.highest.position)
        return interaction.reply("you can't unmute someone with roles higher than you.")
        if(interaction.member.user.id === member.id) return interaction.reply('you cant unmute yourself xd!')
            if(member.id === client.user.id) return interaction.reply('i cant unmute my self lol!')
        if(!member.roles.cache.has(muted.id)) return interaction.reply('this member is not muted.')
        interaction.reply(`✅**| ${user.tag} got has been unmuted.**`)
       
        member.roles.add(muted.id)
        setTimeout(() => {
            member.roles.remove(muted.id).catch(err => {})
        }, ms(time))
    }
    else if (commandName === 'unban') {
        if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) return;
        let user = interaction.options.getString('id')
        try {
            await interaction.guild.bans.fetch(user)
        } catch (e) {
            interaction.reply('This user is not banned.');
            return;
        }
        interaction.guild.bans.fetch(user).then(banned =>{
            interaction.guild.members.unban(user)
        interaction.reply(`✅**| ${banned.user.tag} got has been unbanned.**`)
        })
        
       
    }
    else if (commandName === 'kick') {
        if(!interaction.member.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) return;
        let someone = interaction.options.getUser('member')
        let user = interaction.guild.members.cache.get(someone.id)
        //////
        if(!user) return interaction.reply('member not found in the server.')

            if(user.roles.highest.position > interaction.guild.members.resolve(client.user).roles.highest.position)
            return interaction.reply("i cant kick someone with higher roles than me.")
            if(user.roles.highest.position > interaction.guild.members.resolve(interaction.member).roles.highest.position)
            return interaction.reply("you can't kick someone with roles higher than you.")
            if(interaction.member.user.id === user.id) return interaction.reply('you cant kick yourself xd!')
                if(user.id === client.user.id) return interaction.reply('i cant kick my self lol!')
        
        
        interaction.reply(`✅**| ${user.tag} got kicked from the server.**`)
        interaction.guild.members.kick(user.id,{reason: `kick command by : ${interaction.member.user.tag}`})
    }
    else if (commandName === 'ping') {
        await interaction.reply(`API Latency is ${Math.round(client.ws.ping)}ms`);
		 
	} else if (commandName === 'server') {
        const onlinemembers = interaction.member.guild.members.cache.filter(m => m.presence?.status === 'online'||'dnd'||'afk').size
        const textch = interaction.member.guild.channels.cache.filter(ch => ch.type === "GUILD_TEXT").size
        const voicech = interaction.member.guild.channels.cache.filter(ch => ch.type === "GUILD_VOICE").size
        let customembed = new MessageEmbed()
        .setAuthor(interaction.member.guild.name,interaction.member.guild.iconURL())
        .addField(`🆔 Server ID:`, interaction.member.guild.id, true)
        .addField(`📆 Created On`, interaction.member.guild.createdAt.toString(), true)
        .addField(`👑 Owned by`, `<@${interaction.member.guild.ownerId}>`, true)
        .addFields({name:`👥  Members (${interaction.member.guild.members.cache.size.toString()})`, value: `${onlinemembers} online\n${interaction.member.guild.premiumSubscriptionCount} boosts ✨`, inline: true})
        .addField(`:speech_balloon: Channels (${interaction.member.guild.channels.cache.size.toString()})`, `${textch} Text | ${voicech} voice`, true)
        .addFields({name:`🌍 Others`, value: `**Verification Level:** ${interaction.member.guild.verificationLevel}`, inline: true})
        .addField(`🔐  Roles (${interaction.member.guild.roles.cache.size.toString()})`, `To see a list with all roles use **/roles**`)
        await interaction.reply({embeds: [customembed]})
	} else if (commandName === 'user') {
        let ff = interaction.options.getUser('user') || interaction.member;
        let member = interaction.member.guild.members.cache.get(ff.id)
        if(!interaction.member.roles.cache.has('883452116365099119')) return interaction.reply('you missing the access role.')
        const nopings = new MessageEmbed()
        .setAuthor(`⭐| user information of : ${member.user.username}`, member.user.displayAvatarURL({dynamic: true, size: 2048}))
        .addField(`**⭐| user Name : **`, `${member.user.username}`)
        .addField(`**⭐| user tag : **`, member.user.tag)
        .addField(`**⭐| ID : **`, `${member.user.id}`)
        .addField(`**⭐| creation date : **`, `${moment(member.user.createdAt).format("DD-YY-YYYY [in] HH:mm")}`)
        .addField(`**⭐| joinned server sinse : **`, `${moment(member.user.joinedAt).format("DD-YY-YYYY [in] HH:mm")}`)
        .addField(`**⭐| Avatar link: **`, `${member.user.displayAvatarURL({dynamic: true})}`)
        interaction.reply({embeds : [nopings]})
	}
});

client.login(token);