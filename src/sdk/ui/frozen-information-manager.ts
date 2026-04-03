import type { IObservableValue } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { IFrozenInformation } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, startWith } from 'rxjs';

import { getDefaultValue, ObservableDisposable } from '../utils';

export class FrozenInformationManager extends ObservableDisposable implements IObservableValue<IFrozenInformation> {
  value: IFrozenInformation;
  value$: Observable<IFrozenInformation>;

  constructor(
    frozenRowCount$: Observable<number>,
    frozenColumnCount$: Observable<number>,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    super();

    this.value = { width: 0, height: 0, rowCount: 0, columnCount: 0 };
    this.disposeWithMe(() => void (this.value = getDefaultValue<IFrozenInformation>()));

    const width$ = combineLatest([frozenColumnCount$, column.change$.pipe(startWith(null))]).pipe(
      map(([frozenColumnCount]) => [column.get(frozenColumnCount), frozenColumnCount]),
      distinctUntilChanged((x, y) => x[0] === y[0] && x[1] === y[1]),
    );

    const height$ = combineLatest([frozenRowCount$, row.change$.pipe(startWith(null))]).pipe(
      map(([frozenRowCount]) => [row.get(frozenRowCount), frozenRowCount]),
      distinctUntilChanged((x, y) => x[0] === y[0] && x[1] === y[1]),
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
    this.disposeWithMe(this.value$.subscribe((value) => void (this.value = value)));
  }
}
