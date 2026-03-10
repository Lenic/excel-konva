import type { IDataProvider, TCellChangePatch, TCellContent } from './sdk/data';

import { Container } from './container/core';
import { registerCore, SheetConfig } from './sdk/core';
import { registerData } from './sdk/data';
import { registerEvents } from './sdk/events';
import { ICursorListener, IStageClickListener, IStageDragListener } from './sdk/events/types';
import { registerReference } from './sdk/reference';
import { ICellRenderer, IScrollableRange, registerRenderers, registerUI } from './sdk/ui';

/**
 * Main entrance for the SDK-based implementation
 */
async function bootstrap() {
  const container = new Container();

  // Initialize spreadsheet config with default values
  const config = new SheetConfig();

  // data provider
  const data: TCellContent<any>[][] = [
    ['R1 C2', 'R1 C3', 'R1 C4', 'R1 C5', 'R1 C6', 'R1 C7', 'R1 C8', 'R1 C9', 'R1 C10'],
    ['R2 C2', 'R2 C3', 'R2 C4', 'R2 C5', 'R2 C6', 'R2 C7', 'R2 C8', 'R2 C9', 'R2 C10'],
    ['R3 C2', 'R3 C3', 'R3 C4', 'R3 C5', 'R3 C6', 'R3 C7', 'R3 C8', 'R3 C9', 'R3 C10'],
  ];
  const dataProvider: IDataProvider = {
    get<T = unknown>(rowIndex: number, columnIndex: number): TCellContent<T> | undefined {
      return data[rowIndex - 1]?.[columnIndex - 1];
    },
    set<T = unknown>(patch: TCellChangePatch<T>): void {
      const { range } = patch;
      if (patch.type === 'set') {
        const { values } = patch;
        for (let i = 0; i < values.length; i++) {
          for (let j = 0; j < values[i].length; j++) {
            data[range.rowStartIndex + i - 1][range.columnStartIndex + j - 1] = values[i][j];
          }
        }
      } else {
        for (let i = range.rowStartIndex - 1; i <= range.rowEndIndex - 1; i++) {
          for (let j = range.columnStartIndex - 1; j <= range.columnEndIndex - 1; j++) {
            data[i][j] = null;
          }
        }
      }
    },
  };

  // Register all services
  registerCore(container, config);
  registerReference(container);
  registerData(container, dataProvider);
  registerUI(container);
  registerEvents(container);
  registerRenderers(container);

  // Example initial set
  config.set({ rowCount: 1000, columnCount: 100, frozenRows: 3, frozenColumns: 4 });

  // Start listeners
  container.get(IStageClickListener).startListening();
  container.get(IStageDragListener).startListening();
  container.get(ICursorListener).startListening();

  // Start renderers
  container.get(ICellRenderer).start();
  // container.get(ISelectionRenderer).start();

  // print infomations
  container.get(IScrollableRange).value$.subscribe((range) => {
    const { rowStartIndex, rowEndIndex, columnStartIndex, columnEndIndex } = range;

    document.getElementById('rendered-range-row')!.textContent =
      `${rowStartIndex.toLocaleString()} - ${rowEndIndex.toLocaleString()}`;
    document.getElementById('rendered-range-column')!.textContent =
      `${columnStartIndex.toLocaleString()} - ${columnEndIndex.toLocaleString()}`;
  });

  console.log('SDK initialized.');

  // Use await to satisfy async function requirement
  await Promise.resolve();
}

bootstrap().catch(console.error);
