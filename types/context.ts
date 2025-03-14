import { Context } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";

// Контекст с поддержкой разговоров
export type AdminContext = Context & ConversationFlavor<Context>; 