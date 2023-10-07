import React from 'react';
import App from './App.jsx';
import PrefPage from './preference.jsx';

import ReactDOM from 'react-dom';
import { store } from './app/store';
import { Provider } from 'react-redux';

ReactDOM.render(
  <Provider store={store}>
    <PrefPage />
  </Provider>,
  document.getElementById('root')
);
