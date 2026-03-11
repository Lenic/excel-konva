import type { IAccumulatedDimensionManager } from '../data';
import type { IFrozenInformation, IInformationManager } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, startWith } from 'rxjs';

import { ObservableDisposable } from '../utils';

export class FrozenInformationManager extends ObservableDisposable implements IInformationManager<IFrozenInformation> {
  value$: Observable<IFrozenInformation>;

  constructor(
    frozenRowCount$: Observable<number>,
    frozenColumnCount$: Observable<number>,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    super();

    const width$ = combineLatest([frozenColumnCount$, column.change$.pipe(startWith(null))]).pipe(
      map(([frozenColumnCount]) => [column.get(frozenColumnCount), frozenColumnCount]),
      distinctUntilChanged(),
    );

    const height$ = combineLatest([frozenRowCount$, row.change$.pipe(startWith(null))]).pipe(
      map(([frozenRowCount]) => [row.get(frozenRowCount), frozenRowCount]),
      distinctUntilChanged(),
    );

    this.value$ = combineLatest([width$, height$]).pipe(
      map(
        ([[width, columnCount], [height, rowCount]]): IFrozenInformation => ({
          width,
          height,
          rowCount,
          columnCount,
        }),
      ),
      this.withPublish(),
    );
    this.disposeWithMe(this.value$.subscribe());
  }
}
