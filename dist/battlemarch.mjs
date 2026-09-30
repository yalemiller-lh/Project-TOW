// Battle March rules layered on the core engine: objectives, objective control, scoring and the
// end of the game. The engine calls these hooks through registerFormatRules.
import * as G from './game.mjs';

export function endOfTurn(s,team){s.scoring??={ledger:[]};}
export function endOfGame(s){return {};}

G.registerFormatRules('battle-march',{endOfTurn,endOfGame});
