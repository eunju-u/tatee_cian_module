/**
 * HistoryManager - Canvas Undo / Redo State Stack
 */
export class HistoryManager {
  constructor(canvasEditor) {
    this.canvasEditor = canvasEditor;
    this.undoStack = [];
    this.redoStack = [];
    this.isStateProcessing = false;
    this.maxHistory = 10; // Maximum 10 history states to prevent memory overload
  }

  saveState() {
    if (this.isStateProcessing) return;

    const jsonState = this.canvasEditor.getCanvasJson();
    const jsonString = JSON.stringify(jsonState);

    // Don't save duplicate states
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === jsonString) {
      return;
    }

    this.undoStack.push(jsonString);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  undo(onComplete) {
    if (this.undoStack.length <= 1) return;

    this.isStateProcessing = true;
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);

    const previousState = this.undoStack[this.undoStack.length - 1];
    this.canvasEditor.loadCanvasJson(JSON.parse(previousState), () => {
      this.isStateProcessing = false;
      if (onComplete) onComplete();
    });
  }

  redo(onComplete) {
    if (this.redoStack.length === 0) return;

    this.isStateProcessing = true;
    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);

    this.canvasEditor.loadCanvasJson(JSON.parse(nextState), () => {
      this.isStateProcessing = false;
      if (onComplete) onComplete();
    });
  }

  reset() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
