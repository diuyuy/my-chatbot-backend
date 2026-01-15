import { messages } from "../../common/db/schema/schema";
import type { DBType } from "../../common/types/types";
import type { MyUIMessage } from "../ai/types/types";

export const insertMessages = async (
  db: DBType,
  conversationId: number,
  uiMessages: MyUIMessage[]
) => {
  const msgs = uiMessages.map(({ id, ...rest }) => ({
    messageId: id,
    conversationId,
    ...rest,
  }));

  await db.insert(messages).values(msgs).onConflictDoNothing();
};
