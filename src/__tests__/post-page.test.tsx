import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Page from '../app/posts/[slug]/page';

describe('Post Page', () => {
  it('renders post page', async () => {
    // Await rendering for async components
    await waitFor(() => {
      render(<Page params={{ slug: 'test-post' }} />);
      // Check if the component renders without crashing
      // You may need to add data-testid="post-page" to your Page component for this to work
      // expect(screen.getByTestId('post-page')).toBeInTheDocument();
    });
  });
});
