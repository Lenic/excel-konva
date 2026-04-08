interface IQueueNode<T> {
  value: T;
  next: IQueueNode<T> | null;
}

/**
 * Queue class
 */
export class Queue<T> {
  private head: IQueueNode<T> | null;
  private tail: IQueueNode<T> | null;
  private size: number;

  /**
   * Create a new queue
   */
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Enqueue a value to the tail of the queue
   *
   * @param value - The value to add to the tail of the queue
   */
  enqueue(value: T): void {
    const node: IQueueNode<T> = {
      value,
      next: null,
    };

    this.head ??= node;

    if (!this.tail) {
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }

    this.size++;
  }

  /**
   * Dequeue a value from the head of the queue
   *
   * @returns The value at the head of the queue
   */
  dequeue(): T | undefined {
    if (!this.head) {
      return undefined;
    }

    const { value } = this.head;
    this.head = this.head.next;
    this.size--;

    if (!this.head) {
      this.tail = null;
    }

    return value;
  }

  /**
   * The value at the head of the queue without removing it
   */
  get header(): T | undefined {
    return this.head?.value;
  }

  /**
   * Current queue size
   */
  get length(): number {
    return this.size;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }
}
