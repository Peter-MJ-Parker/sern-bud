import { scheduledTask } from '@sern/handler';

export default scheduledTask({
  timezone: 'America/Chicago',
  trigger: '0 7 * * *',
  async execute(_, sdt) {
    const [c, i, p] = [sdt.deps['@sern/client'], sdt.deps['task-logger'], sdt.deps.prisma];
    const guildBirthdays = await p.birthday.findMany({
      include: { birthdays: true }
    });
    const guilds = await p.guild.findMany({});

    const today = convertToSIO(new Date().toLocaleDateString()).split('2024-')[1].replace('-', '/');

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
      await i.channelSend(_guild, `Task: \`birthday\` congratulated ${totalCongratulations} people.`);
    } else {
      await i.channelSend(_guild, `Task: \`birthday\` had 0 people to congratulate.`);
    }
  }
});

function getRandomMessage(names: string[]): string {
  const birthdayMessages = [
    '🎉 Happy Birthday, {names}! May your day be filled with joy and laughter!',
    "🎂 Wishing a fantastic birthday to {names}! Here's to another year of awesome!",
    "🥳 It's party time for {names}! Happy Birthday and make it a great one!",
    "🎈 Happy Birthday to the amazing {names}! Let's make some noise for the birthday crew!",
    '🌟 Special day alert! Happy Birthday, {names}! Time to celebrate you!',
    '🍰 Cake, candles, and good times await! Happy Birthday, {names}!',
    '🎊 Another year, another adventure! Happy Birthday to the wonderful {names}!',
    '🥂 Cheers to {names} on their birthday! Wishing you all the best today and always!',
    "🎁 Surprise! It's a birthday bonanza for {names}! Hope it's the best one yet!",
    '🌈 Happy Birthday to the one and only {names}! Your awesomeness deserves a celebration!'
  ];
  const randomIndex = Math.floor(Math.random() * birthdayMessages.length);
  let message = birthdayMessages[randomIndex];

  if (names.length === 1) {
    message = message.replace('{names}', names[0]);
  } else if (names.length === 2) {
    message = message.replace('{names}', `${names[0]} and ${names[1]}`);
  } else {
    const lastPerson = names.pop();
    message = message.replace('{names}', `${names.join(', ')}, and ${lastPerson}`);
  }

  return message;
}

function convertToSIO(date: string): string {
  const [month, day, year] = date.split('/').map(part => part.padStart(2, '0'));

  return `${year}-${month}-${day}`;
}
