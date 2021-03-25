/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import fetchMock from 'fetch-mock';
import AlertReportModal from 'src/views/CRUD/alert/AlertReportModal';
import { Provider } from 'react-redux';
import { supersetTheme, ThemeProvider } from '@superset-ui/core';
import { fireEvent, render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

const mockStore = configureStore([thunk]);
const store = mockStore({});
const mockData = {
  id: 1,
  name: 'test report',
  description: 'test report description',
  chart: { id: 1, slice_name: 'test chart' },
  database: { id: 1, database_name: 'test database' },
};

// Report mock is default for testing
const mockedProps = {
  addDangerToast: () => {},
  onAdd: jest.fn(() => []),
  onHide: () => {},
  show: true,
  isReport: false,
};

const editProps = {
  addDangerToast: () => {},
  onAdd: jest.fn(() => []),
  onHide: () => {},
  show: true,
  isReport: false,
  alert: mockData,
};

// Related mocks
const FETCH_CHARTS_ENDPOINT = 'glob:*/api/v1/report/related/chart*';
const FETCH_DASHBOARDS_ENDPOINT = 'glob:*/api/v1/report/related/dashboard?*';
const FETCH_DATABASES_ENDPOINT = 'glob:*/api/v1/report/related/database?*';
const FETCH_OWNERS_ENDPOINT = 'glob:*/api/v1/report/related/owners?q*';
const FETCH_REPORT_ENDPOINT = 'glob:*/api/v1/report/*';

const REPORT_PAYLOAD = { result: mockData };

fetchMock.get(FETCH_REPORT_ENDPOINT, REPORT_PAYLOAD);

fetchMock.get(FETCH_OWNERS_ENDPOINT, {
  result: [{ text: 'Superset Admin', value: 1 }],
});

fetchMock.get(FETCH_DATABASES_ENDPOINT, {
  result: [{ text: 'examples', value: 1 }],
});

fetchMock.get(FETCH_DASHBOARDS_ENDPOINT, {
  result: [
    { text: 'test dashboard 1', value: 1 },
    { text: 'test dashboard 2', value: 2 },
  ],
});

fetchMock.get(FETCH_CHARTS_ENDPOINT, {
  result: [
    { text: 'test chart 1', value: 1 },
    { text: 'test chart 2', value: 2 },
  ],
});

async function renderAndWait(props = mockedProps) {
  const mounted = act(async () => {
    render(
      <ThemeProvider theme={supersetTheme}>
        <Provider store={store}>
          <AlertReportModal {...props} />
        </Provider>
      </ThemeProvider>,
    );
  });

  return mounted;
}

beforeAll(async () => {
  await renderAndWait();
});

// test('renders', () => {
//   // screen.logTestingPlaygroundURL();
//   expect(fetchMock.calls(/report\/related\/chart/)).toHaveLength(1);
//   expect(fetchMock.calls(/report\/related\/dashboard/)).toHaveLength(1);
//   expect(fetchMock.calls(/report\/related\/database/)).toHaveLength(1);
//   expect(fetchMock.calls(/report\/related\/owners/)).toHaveLength(1);
//   expect(screen.getByPlaceholderText(/Alert name/i)).toBeInTheDocument();
//   expect(screen.getByPlaceholderText(/Description/i)).toBeInTheDocument();
// });

test('render a empty modal', () => {
  expect(screen.getByPlaceholderText(/Alert name/i)).toHaveTextContent('');
  expect(screen.getByPlaceholderText(/Description/i)).toHaveTextContent('');
});

test('renders add header for report when no alert is included, and isReport is true', async () => {
  const props = { ...mockedProps, isReport: true };
  await renderAndWait(props);

  expect(screen.getByTestId('alert-report-modal-title')).toHaveTextContent(
    'Add Report',
  );
});
