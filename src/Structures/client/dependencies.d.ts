import { CoreDependencies, Singleton } from "@sern/handler";
import { IntegrationContextType, Sparky } from "../utils/index";
import { BudBot } from "#BudBot";
import pkg from "mongoose";

declare global {
  interface Dependencies extends CoreDependencies {
    "@sern/client": Singleton<BudBot>;
    "@sern/logger": Singleton<Sparky>;
    mongoose: Singleton<pkg.Connection>;
    process: Singleton<NodeJS.Process>;
  }
  interface ValidPublishOptions {
    guildIds?: NonEmptyArray<`${number}`> | undefined;
    dmPermission?: boolean | undefined;
    defaultMemberPermissions?: NonEmptyArray<bigint> | null;
    integrationTypes?: NonEmptyArray<"User" | "Guild">;
    contexts?: NonEmptyArray<IntegrationContextType>;
  }
  type NonEmptyArray<T> = [T, ...T[]];
}

export {};
