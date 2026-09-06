export class EventEmitter<TEvent> {
  private listeners = new Set<(event: TEvent) => void>();

  on(listener: (event: TEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: TEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
