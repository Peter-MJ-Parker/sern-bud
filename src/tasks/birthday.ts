import { scheduledTask } from '@sern/handler';
import { getRandomMessage, today } from '#utils';

export default scheduledTask({
  timezone: 'America/Chicago',
  trigger: '0 7 * * *',
  async execute(_, sdt) {
    const [c, i, p] = [sdt.deps['@sern/client'], sdt.deps['task-logger'], sdt.deps.prisma];
    const guildBirthdays = await p.birthday.findMany({
      include: { birthdays: true }
    });
    const guilds = await p.guild.findMany({});

    let totalCongratulations = 0;
    let _guild;
    for (const guildBirthday of guildBirthdays) {
      const guildData = guilds.find(g => g.gID === guildBirthday.gID);
      if (!guildData) return;

      const guild = c.guilds.cache.get(guildBirthday.gID);
      await guild?.members.fetch();
      if (!guild) return;
      _guild = guild;

      const birthdayChannel = guild.channels.cache.get(guildData.birthdayAnnounceChan);
      if (!birthdayChannel || !birthdayChannel.isTextBased()) return;

      const todaysBirthdays = guildBirthday.birthdays.filter(b => b.date === today);

      if (todaysBirthdays.length > 0) {
        const birthdayNames = todaysBirthdays.map(b => `<@${b.userID}>`);
        const message = `@everyone, We have ${
          birthdayNames.length > 1 ? `birthdays` : `a birthday`
        } today!\n${getRandomMessage(birthdayNames)}`;

        await birthdayChannel.send(message);
        totalCongratulations += todaysBirthdays.length;
      }
    }

    if (totalCongratulations > 0) {
      await i.channelSend(
        _guild,
        `Task: \`birthday\` congratulated ${
          totalCongratulations === 1 ? `1 person` : `${totalCongratulations} people`
        }.`
      );
    } else {
      await i.channelSend(_guild, `Task: \`birthday\` had 0 people to congratulate.`);
    }
    await i.secondarySend(_guild, `Task: \`birthday\` was executed successfully on:`);
  }
});
