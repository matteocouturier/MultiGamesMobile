/**
 * Game registry. Games register themselves here at startup. The lobby uses it
 * to list available games and to instantiate the right one when a room starts.
 */

import { GameDefinition } from '../shared/types';
import { GameModule } from './game';

class GameRegistry {
  private modules = new Map<string, GameModule>();

  register(module: GameModule): void {
    if (this.modules.has(module.definition.id)) {
      throw new Error(`Game already registered: ${module.definition.id}`);
    }
    this.modules.set(module.definition.id, module);
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  get(id: string): GameModule | undefined {
    return this.modules.get(id);
  }

  definitions(): GameDefinition[] {
    return [...this.modules.values()].map((m) => m.definition);
  }
}

export const registry = new GameRegistry();
