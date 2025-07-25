/**
 * This is perm check, it allows users to parse the permission you want and let the plugin do the rest. (check bot or user for that perm).
 *
 * @author @Benzo-Fury [<@762918086349029386>]
 * @author @needhamgary [<@342314924804014081>]
 * @version 1.2.0
 * @example
 * ```ts
 * import { requirePermission } from "../plugins/myPermCheck";
 * import { commandModule, CommandType } from "@sern/handler";
 * export default commandModule({
 *  type: CommandType.Both,
 *  plugins: [ requirePermission('target', 'permission', 'No response (optional)') ],
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 */

import { PermissionsBitField, type GuildMember, type PermissionResolvable } from 'discord.js';
import { CommandType, CommandControlPlugin, controller } from '@sern/handler';

function payload(resp: string) {
  return {
    fetchReply: true,
    content: resp,
    allowedMentions: { repliedUser: false },
    ephemeral: true
  } as const;
}

export function requirePermission(target: 'user' | 'bot' | 'both', perm: PermissionResolvable[], response?: string) {
  return CommandControlPlugin<CommandType.Both>(async (ctx, args) => {
    if (ctx.guild === null) {
      await ctx.reply(payload('This command cannot be used here'));
      return controller.stop();
    }
    const bot = (await ctx.guild.members.fetchMe({
      cache: false
    })!) as GuildMember;
    const memm = ctx.member! as GuildMember;
    switch (target) {
      //*********************************************************************************************************************//
      case 'bot':
        if (!bot.permissions.has(perm)) {
          if (!response) response = `I cannot use this command, please give me ${permsToString(perm)} permission(s).`;
          await ctx.reply(payload(response));
          return controller.stop();
        }
        return controller.next();
      //*********************************************************************************************************************//
      case 'user':
        if (!memm.permissions.has(perm)) {
          if (!response)
            response = `You cannot use this command because you are missing ${permsToString(perm)} permission(s).`;
          await ctx.reply(payload(response));
          return controller.stop();
        }
        return controller.next();
      //*********************************************************************************************************************//
      case 'both':
        if (!bot.permissions.has(perm) || !memm.permissions.has(perm)) {
          if (!response)
            response = `Please ensure <@${bot.user.id}> and <@${memm.user.id}> both have ${permsToString(
              perm
            )} permission(s).`;
          await ctx.reply(payload(response));
          return controller.stop();
        }
        return controller.next();
    }
  });
}

export const permsToString = (...perms: PermissionResolvable[]) => {
  return new PermissionsBitField(perms)
    .toArray()
    .map(perm => `\`${perm}\``)
    .join(', ');
};
