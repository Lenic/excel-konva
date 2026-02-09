import { Container } from './container/core';
import { registerCore, SheetConfig } from './sdk/core';
import { IDataManager, registerData } from './sdk/data';
import { registerEvents } from './sdk/events';
import { IStageClickListener, IStageDragListener } from './sdk/events/types';
import { registerReference } from './sdk/reference';
import { ICellRenderer, registerRenderers, registerUI } from './sdk/ui';

/**
 * Main entrance for the SDK-based implementation
 */
async function bootstrap() {
  const container = new Container();

  // Initialize spreadsheet config with default values
  const config = new SheetConfig();

  // Register all services
  registerCore(container, config);
  registerReference(container);
  registerData(container);
  registerUI(container);
  registerEvents(container);
  registerRenderers(container);

  // Example initial set
  config.set({ rowCount: 1000, columnCount: 100, frozenRows: 2, frozenColumns: 2 });

  // Start listeners
  container.get(IStageClickListener).startListening();
  container.get(IStageDragListener).startListening();

  // Start renderers
  container.get(ICellRenderer).start();
  // container.get(ISelectionRenderer).start();

  // Add initial test data
  const dataManager = container.get(IDataManager);
  dataManager.setCells({ rowStartIndex: 0, columnStartIndex: 0, rowEndIndex: 4, columnEndIndex: 10 }, [
    ['1', 'Header 2', 'Header 3', 'Header 4', 'Header 5', 'Header 6', 'Header 7', 'Header 8', 'Header 9', 'Header 10'],
    ['2', 'R1 C2', 'R1 C3', 'R1 C4', 'R1 C5', 'R1 C6', 'R1 C7', 'R1 C8', 'R1 C9', 'R1 C10'],
    ['3', 'R2 C2', 'R2 C3', 'R2 C4', 'R2 C5', 'R2 C6', 'R2 C7', 'R2 C8', 'R2 C9', 'R2 C10'],
    ['4', 'R3 C2', 'R3 C3', 'R3 C4', 'R3 C5', 'R3 C6', 'R3 C7', 'R3 C8', 'R3 C9', 'R3 C10'],
  ]);

  console.log('SDK initialized.');

  // Use await to satisfy async function requirement
  await Promise.resolve();
}

bootstrap().catch(console.error);
