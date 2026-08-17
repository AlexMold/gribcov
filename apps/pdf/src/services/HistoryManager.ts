import * as fabric from 'fabric';

interface CanvasState {
  /** JSON of the canvas objects (no background) */
  objects: string;
}

export class CanvasHistory {
  private history: CanvasState[] = [];
  private currentStateIndex = -1;
  private canvas: fabric.Canvas;
  private isProcessingAction = false;
  private maxHistorySteps = 30;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.saveState();
  }

  /**
   * Capture the current objects-only state.
   * Background is deliberately not captured so undo/redo affects only objects.
   */
  public saveState(): void {
    if (this.isProcessingAction) return;

    const state: CanvasState = {
      objects: JSON.stringify(
        this.canvas.toJSON().objects
      ),
    };

    // Trim any "future" states if we've undone and then made a new change
    if (this.currentStateIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentStateIndex + 1);
    }

    this.history.push(state);

    // Enforce maximum history size
    if (this.history.length > this.maxHistorySteps) {
      this.history.shift();
    } else {
      this.currentStateIndex++;
    }
  }

  public undo(): boolean {
    if (!this.canUndo()) return false;
    this.isProcessingAction = true;
    this.currentStateIndex--;
    this.restoreState(this.currentStateIndex);
    this.isProcessingAction = false;
    return true;
  }

  public redo(): boolean {
    if (!this.canRedo()) return false;
    this.isProcessingAction = true;
    this.currentStateIndex++;
    this.restoreState(this.currentStateIndex);
    this.isProcessingAction = false;
    return true;
  }

  public canUndo(): boolean {
    return this.currentStateIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentStateIndex < this.history.length - 1;
  }

  private restoreState(stateIndex: number): void {
    if (stateIndex < 0 || stateIndex >= this.history.length) return;

    const state = this.history[stateIndex];
    const objectsJSON = state.objects;
    
    // Store the current background image before any operations
    const currentBackgroundImage = this.canvas.backgroundImage;
    
    // 1️⃣ Remove all existing objects but not the background
    const allObjects = this.canvas.getObjects().slice();
    this.canvas.remove(...allObjects);
    
    // 2️⃣ Process the JSON but don't apply it yet
    const loadedObjects = JSON.parse(objectsJSON);
    
    // 3️⃣ Create fabric objects from the JSON
    fabric.util.enlivenObjects(loadedObjects).then((enlivenedObjects) => {
      // 4️⃣ Add the objects to the canvas
      (enlivenedObjects as fabric.FabricObject[]).forEach(obj => {
        this.canvas.add(obj);
      });
      
      // 5️⃣ Make sure the background is still the original
      if (currentBackgroundImage) {
        this.canvas.backgroundImage = currentBackgroundImage
      }
      
      this.canvas.requestRenderAll();
    });
  }

  /** Clears history and captures the blank initial state */
  public clear(): void {
    this.history = [];
    this.currentStateIndex = -1;
    this.saveState();
  }
}