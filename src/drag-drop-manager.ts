// drag-drop-manager.ts
export class DragDropManager {
  private draggable: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.initDragAndDrop(container);
  }

  private initDragAndDrop(container: HTMLElement): void {
    container.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('dlf-condition')) {
        this.draggable = target;
        target.classList.add('opacity-50');
      }
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const dropZone = target.closest('.dlf-indent');
      if (dropZone) {
        dropZone.classList.add('bg-base-200');
      }
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      // Implementation for handling drops
    });
  }
}
