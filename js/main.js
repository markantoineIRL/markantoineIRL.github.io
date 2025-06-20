let articles = [];
let currentArticle = 0;
let currentImage = 0;
let maxArticles = 50; // Safety limit

// Check if resource exists
async function resourceExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

// Discover available articles
async function discoverArticles() {
    const discovered = [];
    
    for (let i = 1; i <= maxArticles; i++) {
        const id = i.toString().padStart(2, '0');
        const articlePath = `content/articles/article-${id}/`;
        
        // Check if first image exists
        if (await resourceExists(`${articlePath}image-01.jpg`)) {
            // Discover all images
            const images = [];
            for (let imgNum = 1; imgNum <= 20; imgNum++) {
                const imgId = imgNum.toString().padStart(2, '0');
                const imgPath = `${articlePath}image-${imgId}.jpg`;
                if (await resourceExists(imgPath)) images.push(imgPath);
                else break;
            }
            
            // Discover all XMLs
            const xmls = [];
            for (let xmlNum = 1; xmlNum <= 20; xmlNum++) {
                const xmlId = xmlNum.toString().padStart(2, '0');
                const xmlPath = `${articlePath}${xmlId}.xml`;
                if (await resourceExists(xmlPath)) xmls.push(xmlPath);
                else break;
            }
            
            // Add article if valid
            if (images.length > 0 && xmls.length > 0) {
                discovered.push({
                    images,
                    xmls,
                    ad: `ads/${id}.xml`
                });
            }
        }
    }
    return discovered;
}

// Load content for current article/image
async function loadContent() {
    if (articles.length === 0) {
        document.getElementById('main-container').innerHTML = '<p>No articles found</p>';
        return;
    }

    const article = articles[currentArticle];
    document.getElementById('main-image').src = article.images[currentImage];

    try {
        // Load XML content
        const xmlRes = await fetch(article.xmls[currentImage]);
        const xmlText = await xmlRes.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");
        
        document.getElementById('quote-top').textContent = xmlDoc.querySelector('top').textContent;
        document.getElementById('quote-content').textContent = xmlDoc.querySelector('content').textContent;
        document.getElementById('quote-bottom').textContent = xmlDoc.querySelector('bottom').textContent;
    } catch (error) {
        console.error("Error loading XML:", error);
        document.getElementById('quote-content').textContent = "Content unavailable";
    }

    try {
        // Load ad
        const adRes = await fetch(article.ad);
        const adText = await adRes.text();
        const adDoc = new DOMParser().parseFromString(adText, "text/xml");
        document.getElementById('ad-banner').innerHTML = adDoc.querySelector('banner').textContent;
    } catch {
        document.getElementById('ad-banner').innerHTML = "Advertisement";
    }

    // Update navigation
    document.getElementById('img-counter').textContent = 
        `Image ${currentImage + 1}/${article.images.length} | Article ${currentArticle + 1}/${articles.length}`;
    
    document.getElementById('prev-btn').disabled = currentImage === 0;
    document.getElementById('next-btn').disabled = currentImage === article.images.length - 1;
    document.getElementById('prev-article-btn').disabled = currentArticle === 0;
    document.getElementById('next-article-btn').disabled = currentArticle === articles.length - 1;
}

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    articles = await discoverArticles();
    if (articles.length > 0) loadContent();
    
    // Navigation event listeners
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentImage > 0) {
            currentImage--;
            loadContent();
        }
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentImage < articles[currentArticle].images.length - 1) {
            currentImage++;
            loadContent();
        }
    });
    
    document.getElementById('prev-article-btn').addEventListener('click', () => {
        if (currentArticle > 0) {
            currentArticle--;
            currentImage = 0;
            loadContent();
        }
    });
    
    document.getElementById('next-article-btn').addEventListener('click', () => {
        if (currentArticle < articles.length - 1) {
            currentArticle++;
            currentImage = 0;
            loadContent();
        }
    });
});
