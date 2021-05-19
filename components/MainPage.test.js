import { screen } from '@testing-library/react';
import setup from '../src/componentTestUtils';

it('renders correctly', () => {
    setup('/');
    const link = screen.getByText('Discuss');
    expect(link).toBeTruthy();
});
