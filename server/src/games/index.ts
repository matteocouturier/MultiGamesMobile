/**
 * Game catalog. Register every mini-game here. Adding a game is a one-line
 * change: import its module and register it. The engine discovers the rest.
 */

import { registry } from '../core/registry';
import { guessTheWordModule } from './guessTheWord';

export function registerGames(): void {
  registry.register(guessTheWordModule);
  // registry.register(nextGameModule);  <-- future games go here
}
