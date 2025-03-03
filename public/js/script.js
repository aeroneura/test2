// Example JavaScript to fetch posts and display
document.addEventListener('DOMContentLoaded', function() {
    fetch('http://localhost:3000/posts')
        .then(response => response.json())
        .then(posts => {
            const postsContainer = document.getElementById('posts');
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <p>Likes: ${post.likes}</p>
                `;
                postsContainer.appendChild(postElement);
            });
        })
        .catch(error => console.log('Error fetching posts:', error));
});
