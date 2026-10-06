export { createFloor, dismiss, findCustomer, freeSeats, isWaiting, waitingCustomers } from './floor';
export { startDrinking } from './drinking';
export { publishChange, startCustomerSystem, type CustomerSystemDeps } from './system';
export type {
  CustomerCatalog,
  CustomerChange,
  CustomerContext,
  CustomerFloor,
  CustomerInstance,
} from './types';
export { meanSpawnIntervalMs } from './spawn-timing';
export { pickCustomerType, priciestRecipe } from './pick-type';
export { updateCustomers } from './update';
