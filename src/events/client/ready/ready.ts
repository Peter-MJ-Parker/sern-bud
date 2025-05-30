import { EventType, Services, eventModule } from '@sern/handler';
import { Events } from 'discord.js';

export default eventModule({
  type: EventType.Discord,
  name: Events.ClientReady,
  execute: async () => {
    const [{ guilds, user }, logger, prisma, i] = Services('@sern/client', '@sern/logger', 'prisma', 'task-logger');
    logger.success('Logged into Discord as ' + user?.username);

    (async () => {
      try {
        const guild = await guilds.fetch('678398938046267402');
        const guildBirthdays = await prisma.birthday.findFirst({
          where: {
            gID: guild.id
          },
          select: {
            birthdays: true
          }
        });

        if (!guildBirthdays?.birthdays?.length) return;
        const currentMemberIds = new Set(guild.members.cache.keys());
        const birthdaysToDelete = guildBirthdays.birthdays.filter(birthday => !currentMemberIds.has(birthday.userID));
        if (birthdaysToDelete.length === 0) return;
        const userIDsToDelete = birthdaysToDelete.map(b => b.userID);

        await prisma.birthday.update({
          where: {
            gID: guild.id
          },
          data: {
            birthdays: {
              deleteMany: {
                where: {
                  userID: {
                    in: userIDsToDelete
                  }
                }
              }
            }
          }
        });

        console.log(`Deleted ${birthdaysToDelete.length} birthday entries for users no longer in guild ${guild.id}`);

        await i.bdays.logBirthdays(guild);
      } catch (error) {
        logger.error('Error cleaning up birthdays: ' + error);
      }
    })();
  }
});
