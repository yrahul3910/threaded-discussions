import { screen } from '@testing-library/react';
import setup from '../src/componentTestUtils';

describe('renders correctly', () => {
    it('displays title', () => {
        setup('/');
        const link = screen.getByText('Discuss');
        expect(link).toBeTruthy();
    });
});
