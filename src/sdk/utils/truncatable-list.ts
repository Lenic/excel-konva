import { Disposable } from '../../container';

/**
 * Truncatable list
 */
export class TruncatableList<T = unknown> extends Disposable {
  /**
   * Data list
   */
  private list: T[];

  /**
   * Item count
   */
  private count: number;

  /**
   * TruncatableList constructor
   *
   * @param initialList - The initial list
   */
  constructor(initialList?: T[]) {
    super();

    this.list = initialList ?? [];
    this.count = this.list.length;

    this.disposeWithMe(() => {
      this.list = [];
      this.count = 0;
    });
  }

  /**
   * The length of the list
   */
  get length(): number {
    this.checkDisposed();

    return this.count;
  }

  /**
   * Get the item at the specified index
   *
   * @param index - The index of the item
   * @returns The item at the specified index
   */
  get(index: number): T | undefined {
    this.checkDisposed();

    if (index >= this.count) return undefined;

    return this.list[index];
  }

  /**
   * Add an item to the end of the list
   *
   * @param item - The item to add
   */
  push(item: T): void {
    this.checkDisposed();

    if (this.count < this.list.length) {
      this.list[this.count] = item;
    } else {
      this.list.push(item);
    }

    this.count++;
  }

  /**
   * Truncate the list to the specified length
   *
   * @param newCount - The new length of the list
   */
  truncate(newCount: number): void {
    this.checkDisposed();

    if (this.count < newCount) return;

    this.count = newCount;
  }
}
