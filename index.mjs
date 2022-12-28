import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(100);

const [ accAlice, accBob ] =
  await stdlib.newTestAccounts(2, startingBalance);
console.log('Hello, Alice and Bob!');

console.log('Launching...');
const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo());

const NFT = await stdlib.launchToken(accAlice, "Name", "SYM", {supply: 1});
await accBob.tokenAccept(NFT.id);
await stdlib.transfer(accAlice, accBob, 1, NFT.id);

console.log('Starting backends...');
await Promise.all([
  backend.Alice(ctcAlice, {
    ...stdlib.hasRandom,
    params: {
      tok: NFT.id,
      rewards: stdlib.parseCurrency(10),
      deadline: 25,// in blocks
    },
    launched: async (c) => {
      console.log(`Ready at contract ${c}`);
      // trigger the view and show to Bob
      const [tok, rewards, deadline] = await ctcAlice.unsafeViews.seeTerms();
      console.log(`The frontend sees the terms are: \nNFT: ${tok}\n Rewards: ${stdlib.formatCurrency(rewards)}\n Length: ${deadline} blocks`);
    },
    checkStatus: () => {
      // what are we checking? Maybe nothing? Opt-in to the asset?
      return true;
    },
  }),
  backend.Bob(ctcBob, {
    ...stdlib.hasRandom,
  }),
]);

console.log('Goodbye, Alice and Bob!');
