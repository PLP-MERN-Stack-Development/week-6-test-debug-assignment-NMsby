// client/cypress/e2e/post-management.cy.js - E2E tests for post management

describe('Post Management', () => {
    beforeEach(() => {
        cy.cleanDatabase();

        // Create and login as user
        cy.fixture('users').then((users) => {
            const { validUser } = users;
            cy.register(validUser);
            cy.login(validUser.email, validUser.password);
        });

        cy.visit('/dashboard');
    });

    describe('Post Creation', () => {
        it('should create a new post successfully', () => {
            cy.fixture('posts').then((posts) => {
                const { validPost } = posts;

                // Navigate to create post page
                cy.getByTestId('create-post-button').click();
                cy.url().should('include', '/posts/create');

                // Fill post form
                cy.getByTestId('post-title-input').type(validPost.title);
                cy.getByTestId('post-content-input').type(validPost.content);

                // Add tags
                validPost.tags.forEach(tag => {
                    cy.getByTestId('tag-input').type(`${tag}{enter}`);
                });

                // Select category
                cy.getByTestId('category-select').select('Technology');

                // Set status
                cy.getByTestId('status-select').select(validPost.status);

                // Submit form
                cy.getByTestId('create-post-submit').click();

                // Should redirect to post detail page
                cy.url().should('match', /\/posts\/[a-zA-Z0-9-]+$/);

                // Should show success message
                cy.getByTestId('success-message').should('contain', 'Post created successfully');

                // Should display post content
                cy.getByTestId('post-title').should('contain', validPost.title);
                cy.getByTestId('post-content').should('contain', validPost.content);

                // Should show tags
                validPost.tags.forEach(tag => {
                    cy.getByTestId('post-tags').should('contain', tag);
                });
            });
        });

        it('should save post as draft', () => {
            cy.fixture('posts').then((posts) => {
                const { draftPost } = posts;

                cy.getByTestId('create-post-button').click();

                cy.getByTestId('post-title-input').type(draftPost.title);
                cy.getByTestId('post-content-input').type(draftPost.content);
                cy.getByTestId('status-select').select('draft');

                cy.getByTestId('create-post-submit').click();

                // Should show draft indicator
                cy.getByTestId('post-status').should('contain', 'Draft');
                cy.getByTestId('draft-badge').should('be.visible');
            });
        });

        it('should show validation errors for invalid input', () => {
            cy.fixture('posts').then((posts) => {
                const { invalidPost } = posts;

                cy.getByTestId('create-post-button').click();

                // Try to submit with invalid data
                cy.getByTestId('post-title-input').type(invalidPost.title);
                cy.getByTestId('post-content-input').type(invalidPost.content);

                cy.getByTestId('create-post-submit').click();

                // Should show validation errors
                cy.getByTestId('title-error').should('contain', 'Title is required');
                cy.getByTestId('content-error').should('contain', 'at least 10 characters');

                // Should stay on create page
                cy.url().should('include', '/posts/create');
            });
        });

        it('should auto-save draft while typing', () => {
            cy.getByTestId('create-post-button').click();

            // Start typing
            cy.getByTestId('post-title-input').type('Auto-save test');
            cy.getByTestId('post-content-input').type('This content should be auto-saved...');

            // Wait for auto-save
            cy.getByTestId('auto-save-indicator').should('contain', 'Saved');

            // Refresh page
            cy.reload();

            // Content should be restored
            cy.getByTestId('post-title-input').should('have.value', 'Auto-save test');
            cy.getByTestId('post-content-input').should('contain', 'This content should be auto-saved');
        });

        it('should preview post before publishing', () => {
            cy.fixture('posts').then((posts) => {
                const { validPost } = posts;

                cy.getByTestId('create-post-button').click();

                cy.getByTestId('post-title-input').type(validPost.title);
                cy.getByTestId('post-content-input').type(validPost.content);

                // Click preview button
                cy.getByTestId('preview-button').click();

                // Should show preview modal
                cy.getByTestId('preview-modal').should('be.visible');
                cy.getByTestId('preview-title').should('contain', validPost.title);
                cy.getByTestId('preview-content').should('contain', validPost.content);

                // Close preview
                cy.getByTestId('close-preview').click();
                cy.getByTestId('preview-modal').should('not.exist');
            });
        });
    });

    describe('Post Listing', () => {
        beforeEach(() => {
            // Create some test posts
            cy.fixture('posts').then((posts) => {
                cy.createPost(posts.validPost);
                cy.createPost(posts.draftPost);
            });
        });

        it('should display list of posts', () => {
            cy.visit('/posts');

            // Should show posts
            cy.getByTestId('post-list').should('be.visible');
            cy.getByTestId('post-item').should('have.length.at.least', 1);

            // Should show post information
            cy.getByTestId('post-item').first().within(() => {
                cy.getByTestId('post-title').should('be.visible');
                cy.getByTestId('post-excerpt').should('be.visible');
                cy.getByTestId('post-author').should('be.visible');
                cy.getByTestId('post-date').should('be.visible');
            });
        });

        it('should filter posts by status', () => {
            cy.visit('/posts');

            // Show all posts by default
            cy.getByTestId('post-item').should('have.length.at.least', 2);

            // Filter by published
            cy.getByTestId('status-filter').select('published');
            cy.getByTestId('post-item').should('have.length', 1);

            // Filter by draft
            cy.getByTestId('status-filter').select('draft');
            cy.getByTestId('post-item').should('have.length', 1);
        });

        it('should search posts by title', () => {
            cy.visit('/posts');

            // Search for specific post
            cy.getByTestId('search-input').type('Test Post');
            cy.getByTestId('search-button').click();

            // Should show filtered results
            cy.getByTestId('post-item').should('have.length', 1);
            cy.getByTestId('post-title').should('contain', 'Test Post');
        });

        it('should paginate posts', () => {
            // Create many posts to test pagination
            cy.fixture('posts').then((posts) => {
                for (let i = 0; i < 15; i++) {
                    cy.createPost({
                        ...posts.validPost,
                        title: `Test Post ${i + 1}`
                    });
                }
            });

            cy.visit('/posts');

            // Should show pagination
            cy.getByTestId('pagination').should('be.visible');
            cy.getByTestId('page-info').should('contain', 'Page 1');

            // Should show 10 posts per page
            cy.getByTestId('post-item').should('have.length', 10);

            // Go to next page
            cy.getByTestId('next-page').click();
            cy.getByTestId('page-info').should('contain', 'Page 2');
            cy.getByTestId('post-item').should('have.length.at.least', 1);
        });

        it('should sort posts by different criteria', () => {
            cy.visit('/posts');

            // Sort by date (newest first - default)
            cy.getByTestId('sort-select').should('have.value', 'newest');

            // Sort by title
            cy.getByTestId('sort-select').select('title');

            // Verify sorting (posts should be in alphabetical order)
            cy.getByTestId('post-title').then(($titles) => {
                const titles = Array.from($titles).map(el => el.textContent);
                const sortedTitles = [...titles].sort();
                expect(titles).to.deep.equal(sortedTitles);
            });
        });
    });

    describe('Post Editing', () => {
        let postSlug;

        beforeEach(() => {
            // Create a post to edit
            cy.fixture('posts').then((posts) => {
                cy.createPost(posts.validPost).then((post) => {
                    postSlug = post.slug;
                });
            });
        });

        it('should edit existing post', () => {
            cy.visit(`/posts/${postSlug}/edit`);

            // Should pre-fill form with existing data
            cy.getByTestId('post-title-input').should('have.value', 'Test Post Title');

            // Edit the post
            cy.getByTestId('post-title-input').clear().type('Updated Post Title');
            cy.getByTestId('post-content-input').clear().type('Updated post content with more details.');

            // Save changes
            cy.getByTestId('save-post-button').click();

            // Should show success message
            cy.getByTestId('success-message').should('contain', 'Post updated successfully');

            // Should redirect to post detail
            cy.url().should('include', `/posts/${postSlug}`);

            // Should show updated content
            cy.getByTestId('post-title').should('contain', 'Updated Post Title');
            cy.getByTestId('post-content').should('contain', 'Updated post content');
        });

        it('should show unsaved changes warning', () => {
            cy.visit(`/posts/${postSlug}/edit`);

            // Make changes
            cy.getByTestId('post-title-input').clear().type('Modified title');

            // Try to navigate away
            cy.getByTestId('back-to-posts').click();

            // Should show confirmation dialog
            cy.getByTestId('unsaved-changes-modal').should('be.visible');
            cy.getByTestId('unsaved-changes-message').should('contain', 'unsaved changes');

            // Cancel navigation
            cy.getByTestId('cancel-navigation').click();
            cy.url().should('include', '/edit');

            // Save and then navigate
            cy.getByTestId('save-post-button').click();
            cy.getByTestId('back-to-posts').click();
            cy.url().should('include', '/posts');
        });

        it('should publish draft post', () => {
            // Create draft post
            cy.fixture('posts').then((posts) => {
                cy.createPost(posts.draftPost).then((draftPost) => {
                    cy.visit(`/posts/${draftPost.slug}/edit`);

                    // Change status to published
                    cy.getByTestId('status-select').select('published');

                    // Save changes
                    cy.getByTestId('save-post-button').click();

                    // Should show published status
                    cy.getByTestId('post-status').should('contain', 'Published');
                    cy.getByTestId('published-badge').should('be.visible');
                });
            });
        });
    });

    describe('Post Deletion', () => {
        let postSlug;

        beforeEach(() => {
            cy.fixture('posts').then((posts) => {
                cy.createPost(posts.validPost).then((post) => {
                    postSlug = post.slug;
                });
            });
        });

        it('should delete post with confirmation', () => {
            cy.visit(`/posts/${postSlug}`);

            // Click delete button
            cy.getByTestId('delete-post-button').click();

            // Should show confirmation dialog
            cy.getByTestId('delete-confirmation-modal').should('be.visible');
            cy.getByTestId('delete-warning').should('contain', 'permanently deleted');

            // Cancel deletion
            cy.getByTestId('cancel-delete').click();
            cy.getByTestId('delete-confirmation-modal').should('not.exist');

            // Delete again and confirm
            cy.getByTestId('delete-post-button').click();
            cy.getByTestId('confirm-delete').click();

            // Should redirect to posts list
            cy.url().should('include', '/posts');

            // Should show success message
            cy.getByTestId('success-message').should('contain', 'Post deleted successfully');

            // Post should not exist anymore
            cy.visit(`/posts/${postSlug}`, { failOnStatusCode: false });
            cy.getByTestId('not-found-message').should('be.visible');
        });

        it('should require confirmation for deletion', () => {
            cy.visit(`/posts/${postSlug}`);

            // Delete button should require confirmation
            cy.getByTestId('delete-post-button').should('not.have.attr', 'onclick');

            cy.getByTestId('delete-post-button').click();

            // Should not delete immediately
            cy.url().should('include', `/posts/${postSlug}`);
            cy.getByTestId('delete-confirmation-modal').should('be.visible');
        });
    });

    describe('Post Interactions', () => {
        let postSlug;

        beforeEach(() => {
            cy.fixture('posts').then((posts) => {
                cy.createPost(posts.validPost).then((post) => {
                    postSlug = post.slug;
                });
            });
        });

        it('should like and unlike posts', () => {
            cy.visit(`/posts/${postSlug}`);

            // Initially not liked
            cy.getByTestId('like-button').should('not.have.class', 'liked');
            cy.getByTestId('like-count').should('contain', '0');

            // Like the post
            cy.getByTestId('like-button').click();

            // Should show liked state
            cy.getByTestId('like-button').should('have.class', 'liked');
            cy.getByTestId('like-count').should('contain', '1');

            // Unlike the post
            cy.getByTestId('like-button').click();

            // Should return to unliked state
            cy.getByTestId('like-button').should('not.have.class', 'liked');
            cy.getByTestId('like-count').should('contain', '0');
        });

        it('should track post views', () => {
            cy.visit(`/posts/${postSlug}`);

            // Should increment view count
            cy.getByTestId('view-count').should('be.visible');

            // Visit again
            cy.reload();

            // View count should increase
            cy.getByTestId('view-count').then(($el) => {
                const viewCount = parseInt($el.text());
                expect(viewCount).to.be.at.least(1);
            });
        });

        it('should show reading time estimate', () => {
            cy.visit(`/posts/${postSlug}`);

            // Should show reading time
            cy.getByTestId('reading-time').should('contain', 'min read');
            cy.getByTestId('reading-time').should('match', /\d+ min read/);
        });

        it('should share post', () => {
            cy.visit(`/posts/${postSlug}`);

            // Test copy link functionality
            cy.getByTestId('share-button').click();
            cy.getByTestId('copy-link-button').click();

            // Should show confirmation
            cy.getByTestId('copy-success-message').should('contain', 'Link copied');

            // Test social sharing buttons
            cy.getByTestId('share-twitter').should('have.attr', 'href').and('include', 'twitter.com');
            cy.getByTestId('share-facebook').should('have.attr', 'href').and('include', 'facebook.com');
        });
    });

    describe('Post Categories and Tags', () => {
        it('should filter posts by category', () => {
            // Create posts with different categories
            cy.fixture('posts').then((posts) => {
                cy.createPost({ ...posts.validPost, category: 'Technology' });
                cy.createPost({ ...posts.validPost, title: 'Lifestyle Post', category: 'Lifestyle' });
            });

            cy.visit('/posts');

            // Filter by Technology category
            cy.getByTestId('category-filter').select('Technology');

            // Should show only Technology posts
            cy.getByTestId('post-item').should('have.length', 1);
            cy.getByTestId('post-category').should('contain', 'Technology');

            // Filter by Lifestyle category
            cy.getByTestId('category-filter').select('Lifestyle');

            // Should show only Lifestyle posts
            cy.getByTestId('post-item').should('have.length', 1);
            cy.getByTestId('post-category').should('contain', 'Lifestyle');
        });

        it('should filter posts by tags', () => {
            cy.fixture('posts').then((posts) => {
                cy.createPost({ ...posts.validPost, tags: ['react', 'javascript'] });
                cy.createPost({ ...posts.validPost, title: 'Python Post', tags: ['python', 'backend'] });
            });

            cy.visit('/posts');

            // Click on react tag
            cy.getByTestId('tag-filter-react').click();

            // Should show only posts with react tag
            cy.getByTestId('post-item').should('have.length', 1);
            cy.getByTestId('post-tags').should('contain', 'react');

            // Clear filter
            cy.getByTestId('clear-filters').click();

            // Should show all posts again
            cy.getByTestId('post-item').should('have.length', 2);
        });

        it('should show popular tags in sidebar', () => {
            cy.visit('/posts');

            // Should show popular tags widget
            cy.getByTestId('popular-tags').should('be.visible');
            cy.getByTestId('popular-tags').within(() => {
                cy.getByTestId('tag-item').should('have.length.at.least', 1);
            });

            // Clicking on popular tag should filter posts
            cy.getByTestId('popular-tags').within(() => {
                cy.getByTestId('tag-item').first().click();
            });

            // Should filter posts by selected tag
            cy.url().should('include', 'tag=');
        });
    });

    describe('Post Comments', () => {
        let postSlug;

        beforeEach(() => {
            cy.fixture('posts').then((posts) => {
                cy.createPost(posts.validPost).then((post) => {
                    postSlug = post.slug;
                });
            });
        });

        it('should add comment to post', () => {
            cy.visit(`/posts/${postSlug}`);

            // Should show comment form
            cy.getByTestId('comment-form').should('be.visible');

            // Add comment
            cy.getByTestId('comment-input').type('This is a test comment');
            cy.getByTestId('submit-comment').click();

            // Should show new comment
            cy.getByTestId('comment-list').within(() => {
                cy.getByTestId('comment-item').should('contain', 'This is a test comment');
            });

            // Should show comment count
            cy.getByTestId('comment-count').should('contain', '1 comment');
        });

        it('should reply to comments', () => {
            cy.visit(`/posts/${postSlug}`);

            // Add initial comment
            cy.getByTestId('comment-input').type('Initial comment');
            cy.getByTestId('submit-comment').click();

            // Reply to comment
            cy.getByTestId('reply-button').first().click();
            cy.getByTestId('reply-input').type('This is a reply');
            cy.getByTestId('submit-reply').click();

            // Should show reply nested under original comment
            cy.getByTestId('comment-replies').within(() => {
                cy.getByTestId('reply-item').should('contain', 'This is a reply');
            });
        });

        it('should validate comment input', () => {
            cy.visit(`/posts/${postSlug}`);

            // Try to submit empty comment
            cy.getByTestId('submit-comment').click();

            // Should show validation error
            cy.getByTestId('comment-error').should('contain', 'Comment cannot be empty');

            // Try to submit very short comment
            cy.getByTestId('comment-input').type('Hi');
            cy.getByTestId('submit-comment').click();

            // Should show length validation error
            cy.getByTestId('comment-error').should('contain', 'at least 5 characters');
        });

        it('should load more comments when available', () => {
            // Create multiple comments via API
            for (let i = 0; i < 15; i++) {
                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('apiUrl')}/api/posts/${postSlug}/comments`,
                    headers: {
                        Authorization: `Bearer ${window.localStorage.getItem('authToken')}`
                    },
                    body: {
                        content: `Test comment ${i + 1}`
                    }
                });
            }

            cy.visit(`/posts/${postSlug}`);

            // Should show initial batch of comments
            cy.getByTestId('comment-item').should('have.length', 10);

            // Should show load more button
            cy.getByTestId('load-more-comments').should('be.visible');

            // Load more comments
            cy.getByTestId('load-more-comments').click();

            // Should show more comments
            cy.getByTestId('comment-item').should('have.length', 15);

            // Load more button should not be visible if no more comments
            cy.getByTestId('load-more-comments').should('not.exist');
        });
    });

    describe('Post SEO and Metadata', () => {
        let postSlug;

        beforeEach(() => {
            cy.fixture('posts').then((posts) => {
                cy.createPost(posts.validPost).then((post) => {
                    postSlug = post.slug;
                });
            });
        });

        it('should have proper meta tags', () => {
            cy.visit(`/posts/${postSlug}`);

            // Check page title
            cy.title().should('include', 'Test Post Title');

            // Check meta description
            cy.get('meta[name="description"]').should('have.attr', 'content');

            // Check Open Graph tags
            cy.get('meta[property="og:title"]').should('have.attr', 'content', 'Test Post Title');
            cy.get('meta[property="og:type"]').should('have.attr', 'content', 'article');
            cy.get('meta[property="og:url"]').should('have.attr', 'content').and('include', postSlug);

            // Check Twitter Card tags
            cy.get('meta[name="twitter:card"]').should('have.attr', 'content', 'summary_large_image');
            cy.get('meta[name="twitter:title"]').should('have.attr', 'content', 'Test Post Title');
        });

        it('should have structured data', () => {
            cy.visit(`/posts/${postSlug}`);

            // Check for JSON-LD structured data
            cy.get('script[type="application/ld+json"]').should('exist');

            cy.get('script[type="application/ld+json"]').then(($script) => {
                const structuredData = JSON.parse($script.text());
                expect(structuredData['@type']).to.equal('BlogPosting');
                expect(structuredData.headline).to.equal('Test Post Title');
                expect(structuredData.author).to.exist;
                expect(structuredData.datePublished).to.exist;
            });
        });

        it('should have proper URL structure', () => {
            cy.visit(`/posts/${postSlug}`);

            // URL should be SEO-friendly
            cy.url().should('match', /\/posts\/[a-z0-9-]+$/);

            // Should not contain special characters or spaces
            cy.url().should('not.include', ' ');
            cy.url().should('not.include', '%20');
        });
    });

    describe('Performance and Loading', () => {
        it('should show loading states', () => {
            // Intercept API calls to add delay
            cy.intercept('GET', '/api/posts*', (req) => {
                req.reply((res) => {
                    return new Promise((resolve) => {
                        setTimeout(() => resolve(res), 1000);
                    });
                });
            }).as('loadPosts');

            cy.visit('/posts');

            // Should show loading skeleton
            cy.getByTestId('posts-loading').should('be.visible');

            cy.wait('@loadPosts');

            // Loading should disappear
            cy.getByTestId('posts-loading').should('not.exist');
            cy.getByTestId('post-list').should('be.visible');
        });

        it('should lazy load images', () => {
            cy.fixture('posts').then((posts) => {
                cy.createPost({
                    ...posts.validPost,
                    featuredImage: 'https://via.placeholder.com/800x400'
                }).then((post) => {
                    cy.visit(`/posts/${post.slug}`);

                    // Featured image should have lazy loading
                    cy.getByTestId('featured-image').should('have.attr', 'loading', 'lazy');

                    // Should show placeholder while loading
                    cy.getByTestId('image-placeholder').should('be.visible');

                    // Wait for image to load
                    cy.getByTestId('featured-image').should('be.visible');
                    cy.getByTestId('image-placeholder').should('not.exist');
                });
            });
        });

        it('should handle infinite scroll', () => {
            // Create many posts
            cy.fixture('posts').then((posts) => {
                for (let i = 0; i < 25; i++) {
                    cy.createPost({
                        ...posts.validPost,
                        title: `Post ${i + 1}`
                    });
                }
            });

            cy.visit('/posts');

            // Should show initial batch
            cy.getByTestId('post-item').should('have.length', 10);

            // Scroll to bottom
            cy.scrollTo('bottom');

            // Should load more posts
            cy.getByTestId('post-item').should('have.length', 20);

            // Scroll again
            cy.scrollTo('bottom');

            // Should load remaining posts
            cy.getByTestId('post-item').should('have.length', 25);
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', () => {
            // Intercept API calls to simulate network error
            cy.intercept('GET', '/api/posts*', { forceNetworkError: true }).as('networkError');

            cy.visit('/posts');

            // Should show error message
            cy.getByTestId('error-message').should('contain', 'failed to load');

            // Should show retry button
            cy.getByTestId('retry-button').should('be.visible');

            // Remove intercept and retry
            cy.intercept('GET', '/api/posts*').as('loadPosts');
            cy.getByTestId('retry-button').click();

            cy.wait('@loadPosts');

            // Should show posts after retry
            cy.getByTestId('post-list').should('be.visible');
        });

        it('should handle 404 errors for non-existent posts', () => {
            cy.visit('/posts/non-existent-post', { failOnStatusCode: false });

            // Should show 404 page
            cy.getByTestId('not-found-page').should('be.visible');
            cy.getByTestId('not-found-message').should('contain', 'Post not found');

            // Should have link back to posts
            cy.getByTestId('back-to-posts-link').should('be.visible');
            cy.getByTestId('back-to-posts-link').click();

            cy.url().should('include', '/posts');
        });

        it('should handle server errors', () => {
            // Intercept API calls to simulate server error
            cy.intercept('GET', '/api/posts*', { statusCode: 500 }).as('serverError');

            cy.visit('/posts');

            // Should show server error message
            cy.getByTestId('error-message').should('contain', 'server error');

            // Should not show retry button for 500 errors (optional, based on UX design)
            cy.getByTestId('contact-support').should('be.visible');
        });
    });
});