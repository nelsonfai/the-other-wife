/** @format */

type AsyncHandler<TPayload> = (payload: TPayload) => Promise<void> | void;

export class SignalDispatcher<TSignals extends Record<string, unknown>> {
  private handlers = new Map<keyof TSignals, AsyncHandler<any>[]>();

  on<TKey extends keyof TSignals>(
    signal: TKey,
    handler: AsyncHandler<TSignals[TKey]>,
  ) {
    const handlers = this.handlers.get(signal) ?? [];
    handlers.push(handler);
    this.handlers.set(signal, handlers);
  }

  async emit<TKey extends keyof TSignals>(
    signal: TKey,
    payload: TSignals[TKey],
  ) {
    const handlers = this.handlers.get(signal) ?? [];

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(payload);
        } catch (error: any) {
          console.error("Signal handler failed", {
            signal: String(signal),
            message: error?.message,
          });
        }
      }),
    );
  }
}
