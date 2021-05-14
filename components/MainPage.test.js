import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import setup from './testUtils';

it('navigates to profy.dev/employers when left link is clicked', () => {
    setup('/');
    const link = screen.getByText('profy.dev');
    expect(link.closest('a')).toHaveAttribute('href', 'https://profy.dev/employers');
});
