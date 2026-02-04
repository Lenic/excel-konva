import { Disposable } from '../../container';

export class TruncatableList<T = unknown> extends Disposable {
  private list: T[];
  private count: number;

  constructor(initialList?: T[]) {
    super();

    this.list = initialList ?? [];
    this.count = this.list.length;

    this.disposeWithMe(() => {
      this.list = [];
      this.count = 0;
    });
  }

  get length(): number {
    this.checkDisposed();

    return this.count;
  }

  get(index: number): T | undefined {
    this.checkDisposed();

    if (index >= this.count) return undefined;

    return this.list[index];
  }

  push(item: T): void {
    this.checkDisposed();

    if (this.count < this.list.length) {
      this.list[this.count] = item;
    } else {
      this.list.push(item);
    }

    this.count++;
  }

  truncate(newCount: number): void {
    this.checkDisposed();

    this.count = newCount;
  }
}
