import { scheduledTask } from '@sern/handler';

export default scheduledTask({
  timezone: 'America/Chicago',
  trigger: '0 8 * * *',
  async execute(tasks, sdt) {
    console.log('starting bday task');
    const [c, i, p] = [sdt.deps['@sern/client'], sdt.deps['task-logger'], sdt.deps.prisma];
    const birthdays = await p.birthday.findMany({});
    const guilds = await p.guild.findMany({});

    const today = convertToSIO(new Date().toLocaleDateString()).split('2024-')[1];
    const todaysBirthdays = birthdays.filter(b => b.date === today);

    c.guilds.cache.forEach(async guild => {
      const guildData = guilds.find(g => g.gID === guild.id);
      if (guildData) {
        const birthdayChannel = guild.channels.cache.find(
          channel => channel.id === guildData.birthdayChan && channel.isTextBased()
        );

        if (birthdayChannel && birthdayChannel.isTextBased()) {
          if (todaysBirthdays.length > 0) {
            const birthdayNames = todaysBirthdays.map(b => `<@${b.id}>`);
            const message = getRandomMessage(birthdayNames);

            birthdayChannel.send(message);
          }
        }
      }
    });
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
