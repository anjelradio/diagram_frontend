/** A local echo is already represented by the optimistic durable operation. */
export function shouldApplyRealtimeMutation(
  senderId: string,
  viewerId: string
): boolean {
  return senderId !== viewerId;
}
