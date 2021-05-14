import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import App from '../components/App';

const setup = (initialPath = '/') => {
    /*
     * Access history as described in the docs
     * https://reactrouter.com/web/guides/testing/checking-location-in-tests
     */
    let history;
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <App />
            <Route
                path="*"
                render={(props) => {
                    history = { props };
                    return null;
                }}
            />
        </MemoryRouter>,
    );
    return { history };
};

export default setup;
