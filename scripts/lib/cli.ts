export function exitWithError(error: unknown): never {
  if (typeof error === 'object' && error !== null && 'shortMessage' in error) {
    const shortMessage = error.shortMessage;
    if (typeof shortMessage === 'string' && shortMessage.length > 0) {
      console.error(shortMessage);
      process.exit(1);
    }
  }
  console.error(error);
  process.exit(1);
}
