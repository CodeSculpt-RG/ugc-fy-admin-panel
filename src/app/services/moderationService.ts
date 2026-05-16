export const moderationService = {
  getQueue: async () => {
    // Moderation queue not yet fully synchronized, returning empty queue
    return [];
  },
  approve: async (id: string) => {
    console.log(`[MODERATION SERVICE] Action: APPROVE, ID: ${id}`);
    return { success: true };
  },
  reject: async (id: string, reason: string) => {
    console.log(`[MODERATION SERVICE] Action: REJECT, ID: ${id}, Reason: ${reason}`);
    return { success: true };
  },
};
