import { createStore, applyMiddleware, compose } from 'redux';
import * as thunkMiddleware from "redux-thunk";
import rootReducer from '../reducers';
import { createLogger } from 'redux-logger';

const composeEnhancers =
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
    }) : compose;

const middlewares = [thunkMiddleware.thunk];

if (process.env.NODE_ENV === 'development' && process.env.TARO_ENV !== 'quickapp') {
  middlewares.push(createLogger());
}

const enhancer = composeEnhancers(
  applyMiddleware(...middlewares),
  // other store enhancers if any
);

export default function configStore() {
  console.log(thunkMiddleware.thunk);
  const store = createStore(rootReducer, enhancer);
  return store;
}
