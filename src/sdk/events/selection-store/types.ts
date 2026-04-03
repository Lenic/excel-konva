import type { IDisposable, TIdentifier } from '../../../container';
import type { ICellRange, ILocation, IObservableValue } from '../../core';

export interface ISelectionRegion {
  id: number;
  range: ICellRange;
  activeCell: ILocation;
}

export interface ISelectionRegionUpdater extends IDisposable {
  update(endLocation: ILocation): void;
  complete(): void;
}

export interface ISelectionStore extends IDisposable, IObservableValue<ISelectionRegion[]> {
  create(startLocation: ILocation, isMultiSelect: boolean): ISelectionRegionUpdater;
  reset(regions?: ISelectionRegion[]): void;
}
export const ISelectionStore: TIdentifier<ISelectionStore> = Symbol('ISelectionStore');
